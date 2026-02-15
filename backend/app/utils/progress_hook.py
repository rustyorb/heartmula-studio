import tqdm as _tqdm_module
from typing import Callable, Optional


class ProgressHook:
    """Monkey-patches tqdm to intercept HeartMuLa generation progress."""

    def __init__(self, callback: Callable[[int, int], None]):
        self.callback = callback
        self._original_tqdm = None

    def install(self):
        self._original_tqdm = _tqdm_module.tqdm

        callback = self.callback

        class InstrumentedTqdm(_tqdm_module.tqdm):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            def update(self, n=1):
                super().update(n)
                if self.total:
                    callback(self.n, self.total)

        _tqdm_module.tqdm = InstrumentedTqdm

    def uninstall(self):
        if self._original_tqdm:
            _tqdm_module.tqdm = self._original_tqdm
            self._original_tqdm = None

    def __enter__(self):
        self.install()
        return self

    def __exit__(self, *args):
        self.uninstall()
