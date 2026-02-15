import asyncio
import gc
import logging
import torch
from pathlib import Path
from typing import Optional, Callable
from enum import Enum
from app.config import Settings

logger = logging.getLogger(__name__)


class ModelState(str, Enum):
    UNLOADED = "unloaded"
    DOWNLOADING = "downloading"
    LOADING = "loading"
    READY = "ready"
    GENERATING = "generating"
    ERROR = "error"


class PipelineManager:
    """Manages HeartMuLa pipeline lifecycle with real model support."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.state = ModelState.UNLOADED
        self._gen_pipeline = None
        self._transcriptor_pipeline = None
        self._model_path = Path(settings.model_path).resolve()

    def _models_present(self) -> bool:
        """Check if all required model files are downloaded."""
        version = self.settings.model_version
        checks = [
            self._model_path / f"HeartMuLa-oss-{version}",
            self._model_path / "HeartCodec-oss",
            self._model_path / "tokenizer.json",
            self._model_path / "gen_config.json",
        ]
        return all(p.exists() for p in checks)

    async def download_models(self, progress_callback: Optional[Callable] = None) -> None:
        """Download models from HuggingFace Hub if not already present."""
        if self._models_present():
            logger.info("Models already downloaded")
            if progress_callback:
                await progress_callback(1.0, "Models already downloaded")
            return

        self.state = ModelState.DOWNLOADING
        self._model_path.mkdir(parents=True, exist_ok=True)

        from huggingface_hub import snapshot_download

        version = self.settings.model_version

        downloads = [
            {
                "repo": "HeartMuLa/HeartMuLaGen",
                "local_dir": str(self._model_path),
                "label": "tokenizer & config",
            },
            {
                "repo": f"HeartMuLa/HeartMuLa-oss-{version}-happy-new-year",
                "local_dir": str(self._model_path / f"HeartMuLa-oss-{version}"),
                "label": f"HeartMuLa {version} model",
            },
            {
                "repo": "HeartMuLa/HeartCodec-oss-20260123",
                "local_dir": str(self._model_path / "HeartCodec-oss"),
                "label": "HeartCodec",
            },
        ]

        for i, dl in enumerate(downloads):
            step_progress = i / len(downloads)
            if progress_callback:
                await progress_callback(step_progress, f"Downloading {dl['label']}...")
            logger.info(f"Downloading {dl['repo']} → {dl['local_dir']}")

            await asyncio.to_thread(
                snapshot_download,
                repo_id=dl["repo"],
                local_dir=dl["local_dir"],
            )

        if progress_callback:
            await progress_callback(1.0, "All models downloaded")
        logger.info("All models downloaded successfully")

    async def load_generation_model(self, progress_callback: Optional[Callable] = None) -> None:
        """Download (if needed) and load the generation pipeline."""
        try:
            # Download models first
            await self.download_models(progress_callback=progress_callback)

            self.state = ModelState.LOADING
            if progress_callback:
                await progress_callback(0.8, "Initializing pipeline...")

            # Load pipeline in a thread (involves loading tokenizer + config,
            # and optionally loading model weights if lazy_load=False)
            def _load():
                from heartlib.pipelines.music_generation import (
                    HeartMuLaGenPipeline,
                    HeartMuLaGenConfig,
                    _resolve_paths,
                    _resolve_devices,
                )
                from heartlib.heartmula.modeling_heartmula import HeartMuLa
                from tokenizers import Tokenizer

                device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
                dtype = torch.float16 if torch.cuda.is_available() else torch.float32
                version = self.settings.model_version

                mula_path, codec_path, tokenizer_path, gen_config_path = _resolve_paths(
                    str(self._model_path), version
                )
                mula_device, codec_device, lazy_load = _resolve_devices(
                    device, self.settings.lazy_load
                )
                tokenizer = Tokenizer.from_file(tokenizer_path)
                gen_config = HeartMuLaGenConfig.from_file(gen_config_path)

                pipeline = HeartMuLaGenPipeline(
                    heartmula_path=mula_path,
                    heartcodec_path=codec_path,
                    heartmula_device=mula_device,
                    heartcodec_device=codec_device,
                    heartmula_dtype=dtype,
                    heartcodec_dtype=dtype,
                    lazy_load=lazy_load,
                    muq_mulan=None,
                    text_tokenizer=tokenizer,
                    config=gen_config,
                )

                # For GPUs with < 16GB VRAM, pre-load model with reduced KV cache.
                # The backbone defaults to max_seq_len=8192, but 60s audio
                # = 750 frames + ~50 token prompt = ~800 tokens. Reducing to
                # 1024 saves ~1.6GB of VRAM from KV cache allocation.
                if torch.cuda.is_available():
                    total_vram = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                    if total_vram < 16 and lazy_load:
                        reduced_seq_len = 1024
                        logger.info(
                            f"VRAM {total_vram:.1f}GB < 16GB: pre-loading HeartMuLa "
                            f"with max_seq_len={reduced_seq_len} (was 8192)"
                        )
                        # Eagerly load HeartMuLa and reduce seq_len before any
                        # generation call can trigger setup_caches with 8192.
                        from heartlib.heartmula.modeling_heartmula import HeartMuLa as _HeartMuLa
                        mula = _HeartMuLa.from_pretrained(
                            mula_path,
                            device_map=mula_device,
                            dtype=dtype,
                        )
                        mula.backbone.max_seq_len = reduced_seq_len
                        pipeline._mula = mula
                        logger.info(
                            f"HeartMuLa loaded: {torch.cuda.memory_allocated()/1024**3:.1f}GB VRAM"
                        )

                return pipeline

            self._gen_pipeline = await asyncio.to_thread(_load)

            self.state = ModelState.READY
            if progress_callback:
                await progress_callback(1.0, "Model ready")
            logger.info(
                f"Generation pipeline ready (lazy_load={self.settings.lazy_load})"
            )

        except Exception as e:
            self.state = ModelState.ERROR
            logger.error(f"Failed to load model: {e}")
            raise

    def _cleanup_caches(self) -> None:
        """Clean up KV caches after failed generation to prevent memory leaks."""
        if self._gen_pipeline is None or self._gen_pipeline._mula is None:
            return
        try:
            mula = self._gen_pipeline._mula
            for layer in mula.backbone.layers:
                if hasattr(layer.attn, 'kv_cache') and layer.attn.kv_cache is not None:
                    layer.attn.kv_cache = None
            for layer in mula.decoder.layers:
                if hasattr(layer.attn, 'kv_cache') and layer.attn.kv_cache is not None:
                    layer.attn.kv_cache = None
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            logger.info("Cleaned up stale KV caches")
        except Exception as e:
            logger.warning(f"Cache cleanup failed: {e}")

    def generate_sync(
        self,
        lyrics: str,
        tags: str,
        save_path: Path,
        max_audio_length_ms: int = 240000,
        temperature: float = 1.0,
        topk: int = 50,
        cfg_scale: float = 1.5,
    ) -> Path:
        """Run generation synchronously (called from a thread via asyncio.to_thread).

        Uses the real HeartMuLa pipeline. Progress is tracked via
        the ProgressHook tqdm monkey-patch installed by the caller.
        """
        if self._gen_pipeline is None:
            raise RuntimeError(f"Model not ready (state: {self.state})")

        save_path.parent.mkdir(parents=True, exist_ok=True)

        # Clean up any stale caches from previous failed generations
        self._cleanup_caches()

        logger.info(f"Generating audio → {save_path} (cfg_scale={cfg_scale})")
        try:
            # Run pipeline stages manually so we control saving
            # (torchaudio.save in PyTorch 2.10+ requires torchcodec/FFmpeg libs)
            pipeline = self._gen_pipeline
            preprocess_kwargs, forward_kwargs, postprocess_kwargs = (
                pipeline._sanitize_parameters(
                    max_audio_length_ms=max_audio_length_ms,
                    temperature=temperature,
                    topk=topk,
                    cfg_scale=cfg_scale,
                    save_path=str(save_path),
                )
            )
            model_inputs = pipeline.preprocess(
                {"lyrics": lyrics, "tags": tags}, **preprocess_kwargs
            )
            model_outputs = pipeline._forward(model_inputs, **forward_kwargs)

            # Decode audio frames with codec
            frames = model_outputs["frames"].to(pipeline.codec_device)
            wav = pipeline.codec.detokenize(frames)
            pipeline._unload()

            # Save using soundfile → WAV, then convert to MP3 via ffmpeg
            import soundfile as sf
            import subprocess
            wav_np = wav.to(torch.float32).cpu().numpy().T  # (channels, samples) → (samples, channels)
            wav_path = str(save_path).replace(".mp3", ".wav")
            sf.write(wav_path, wav_np, 48000)
            # Convert WAV → MP3 using system ffmpeg
            subprocess.run(
                ["ffmpeg", "-y", "-i", wav_path, "-b:a", "192k", str(save_path)],
                capture_output=True, check=True,
            )
            Path(wav_path).unlink(missing_ok=True)  # Clean up temp WAV
            logger.info(f"Saved audio → {save_path}")

        except torch.cuda.OutOfMemoryError:
            # Clean up and re-raise with helpful message
            self._cleanup_caches()
            raise RuntimeError(
                f"GPU out of memory during generation. "
                f"Try reducing max_length_ms or using cfg_scale=1.0."
            )

        logger.info(f"Generation complete → {save_path}")
        return save_path

    async def generate(
        self,
        lyrics: str,
        tags: str,
        save_path: Path,
        max_audio_length_ms: int = 240000,
        temperature: float = 1.0,
        topk: int = 50,
        cfg_scale: float = 1.5,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> Path:
        """Run generation asynchronously with tqdm-based progress tracking."""
        if self._gen_pipeline is None:
            raise RuntimeError(f"Model not ready (state: {self.state})")

        self.state = ModelState.GENERATING

        from app.utils.progress_hook import ProgressHook

        # Wrap the sync callback so it can be called from the generation thread
        hook_callback = progress_callback if progress_callback else lambda s, t: None
        hook = ProgressHook(hook_callback)

        try:
            def _run():
                with hook:
                    self.generate_sync(
                        lyrics=lyrics,
                        tags=tags,
                        save_path=save_path,
                        max_audio_length_ms=max_audio_length_ms,
                        temperature=temperature,
                        topk=topk,
                        cfg_scale=cfg_scale,
                    )

            await asyncio.to_thread(_run)
        finally:
            self.state = ModelState.READY

        return save_path

    async def load_transcriptor(self) -> None:
        """Load the transcription pipeline (Whisper-based)."""
        transcriptor_path = self._model_path / "HeartTranscriptor-oss"
        if not transcriptor_path.exists():
            logger.info("Downloading HeartTranscriptor...")
            from huggingface_hub import snapshot_download
            await asyncio.to_thread(
                snapshot_download,
                repo_id="HeartMuLa/HeartTranscriptor-oss",
                local_dir=str(transcriptor_path),
            )

        def _load():
            from heartlib import HeartTranscriptorPipeline

            device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
            dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            return HeartTranscriptorPipeline.from_pretrained(
                pretrained_path=str(self._model_path),
                device=device,
                dtype=dtype,
            )

        self._transcriptor_pipeline = await asyncio.to_thread(_load)
        logger.info("Transcription pipeline loaded")

    async def transcribe(self, audio_path: Path) -> str:
        """Transcribe audio to lyrics using HeartTranscriptor."""
        if self._transcriptor_pipeline is None:
            await self.load_transcriptor()

        def _run():
            result = self._transcriptor_pipeline(str(audio_path))
            return result["text"]

        text = await asyncio.to_thread(_run)
        return text

    def get_state(self) -> str:
        return self.state.value

    async def unload(self) -> None:
        """Unload all models from GPU."""
        if self._gen_pipeline is not None:
            del self._gen_pipeline
            self._gen_pipeline = None
        if self._transcriptor_pipeline is not None:
            del self._transcriptor_pipeline
            self._transcriptor_pipeline = None

        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        self.state = ModelState.UNLOADED
        logger.info("Models unloaded")
