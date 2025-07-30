import sys
from typing import Dict, Any

def validate_config(config: Dict[str, Any]) -> bool:
    """Проверяет конфиг на соответствие требуемой структуре"""
    try:
        # Проверка корневых полей
        if not all(key in config for key in ['id', 'groups']):
            raise ValueError("Config must contain 'id' and 'groups' fields")
        
        if not isinstance(config['id'], int):
            raise ValueError("'id' must be integer")
        
        if not isinstance(config['groups'], list):
            raise ValueError("'groups' must be a list")
        
        # Проверка каждой группы
        for group in config['groups']:
            validate_group(group)
        
        return True
    
    except ValueError as e:
        print(f"Config validation error: {str(e)}", file=sys.stderr)
        return False

def validate_group(group: Dict[str, Any]) -> None:
    """Проверяет структуру группы"""
    required_fields = ['name', 'filesPath', 'workTime', 'loop', 'freq']
    if not all(field in group for field in required_fields):
        raise ValueError(f"Group must contain fields: {required_fields}")
    
    if not isinstance(group['name'], str):
        raise ValueError("'name' must be string")
    
    if not isinstance(group['filesPath'], str):
        raise ValueError("'filesPath' must be string")
    
    if not isinstance(group['workTime'], int) or group['workTime'] <= 0:
        raise ValueError("'workTime' must be positive integer")
    
    if not isinstance(group['loop'], bool):
        raise ValueError("'loop' must be boolean")
    
    if not isinstance(group['freq'], int) or group['freq'] <= 0:
        raise ValueError("'freq' must be positive integer")
    
    # Проверка sensors (может быть в config или прямо в группе)
    sensors = group.get('sensors', group.get('sensors'))
    baseIP = group.get('sensors', group.get('sensors'))
    if not sensors:
        raise ValueError("Group must contain 'sensors' either in root or in 'config'")
    
    if not isinstance(sensors, list):
        raise ValueError("'sensors' must be a list")
    
    for sensor in sensors:
        validate_sensor(sensor)

def validate_sensor(sensor: Dict[str, Any]) -> None:
    """Проверяет структуру сенсора"""
    required_fields = ['name', 'ip', 'vlan']
    if not all(field in sensor for field in required_fields):
        raise ValueError(f"Sensor must contain fields: {required_fields}")
    
    if not isinstance(sensor['name'], str):
        raise ValueError("Sensor 'name' must be string")
    
    if not isinstance(sensor['ip'], str):
        raise ValueError("Sensor 'ip' must be string")
    
    if not isinstance(sensor['vlan'], str):
        raise ValueError("Sensor 'vlan' must be string")
