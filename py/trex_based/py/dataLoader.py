import zipfile
from pathlib import Path
from typing import Dict, Union, BinaryIO

def load_bin_files_from_zip(zip_path: Union[str, Path]) -> Dict[str, Dict[str, bytes]]:
    """
    Читает .zip архив и загружает все .bin файлы в RAM.
    
    Args:
        zip_path: Путь к .zip архиву.
    
    Returns:
        Словарь вида {zipName: {fileName: binaryData}}.
    """
    result = {}
    zip_path = Path(zip_path)
    
    if not zip_path.exists():
        raise FileNotFoundError(f"ZIP file not found: {zip_path}")
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_name = zip_path.stem  # Имя архива без расширения
        
        # Собираем все .bin файлы
        bin_files = [f for f in zip_ref.namelist() if f.lower().endswith('.bin')]
        
        if not bin_files:
            raise ValueError(f"No .bin files found in {zip_path}")
        
        # Читаем каждый .bin файл в память
        file_data = {}
        for bin_file in bin_files:
            with zip_ref.open(bin_file, 'r') as bin_f:
                file_data[bin_file] = bin_f.read()  # Получаем bytes
        
        result[zip_name] = file_data
    
    return result