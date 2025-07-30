import json
import sys
import argparse
from validator import validate_config
from dataLoader import load_bin_files_from_zip
def load_config_to_dict(file_path):
    """Загружает JSON-конфиг из файла и возвращает словарь"""
    try:
        with open(file_path, 'r') as file:
            config_dict = json.load(file)
        return config_dict
    except FileNotFoundError:
        print(f"Ошибка: Файл {file_path} не найден")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Ошибка: Файл {file_path} содержит невалидный JSON")
        sys.exit(1)

def main():
    # Настраиваем парсер аргументов командной строки
    parser = argparse.ArgumentParser(description='Загрузка JSON-конфига в словарь')
    parser.add_argument('--conf', '--config', type=str, help='Путь к JSON-конфигурационному файлу')
    
    # Парсим аргументы
    args = parser.parse_args()
    
    # Загружаем конфиг
    config_dict = load_config_to_dict(args.conf)
    if not validate_config(config_dict):
        exit()
    
    print("Словарь успешно создан:")
    print(json.dumps(config_dict, indent=2))
    

if __name__ == "__main__":
    main()