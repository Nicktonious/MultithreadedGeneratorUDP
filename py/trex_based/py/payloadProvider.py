from fileReader import FileReader

def provider(fileName, n):
    reader = FileReader(fileName)
    currChunk: memoryview = reader.next_chunk()
    
    def getPayload(ind):
        if currChunk is None: 
            return None
        return currChunk[ind:10]
    