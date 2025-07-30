import mmap
import platform


CHUNK_SIZE = 2 * 1024 * 1024  # 2 MB

class FileReader:
    def __init__(self, chunk_size=CHUNK_SIZE):
        self._chunk_size = chunk_size
        self._file = None
        self._mm = None
        self._file_size = 0
        self._chunk_offset = 0  

    def open(self, file_name):
        self._file = open(file_name, 'rb')
        self._file.seek(0, 2)
        self._file_size = self._file.tell()
        self._file.seek(0)

        if self._mm:
            self._mm.close()
        
        self._mm = mmap.mmap(self._file.fileno(), offset=0, length=self._file_size, access=mmap.ACCESS_READ)
        
        if platform.system() != 'Windows':
            self._mm.madvise(mmap.MADV_SEQUENTIAL | mmap.MADV_HUGEPAGE)

        self._chunk_offset = 0

    def next_chunk(self):
        if self._chunk_offset >= len(self._mm):
            return None  # EOF

        end = self._chunk_offset + self._chunk_size

        view = memoryview(self._mm)[self._chunk_offset:end]
        self._chunk_offset = end
        # process(view)

        return view

    def close(self):
        if self._mm:
            self._mm.close()
        if self._file:
            self._file.close()

