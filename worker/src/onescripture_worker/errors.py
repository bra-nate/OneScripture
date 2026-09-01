"""Worker errors with explicit retry semantics."""


class WorkerError(RuntimeError):
    def __init__(self, code: str, message: str, *, retryable: bool) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable


class PermanentWorkerError(WorkerError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(code, message, retryable=False)


class TransientWorkerError(WorkerError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(code, message, retryable=True)
