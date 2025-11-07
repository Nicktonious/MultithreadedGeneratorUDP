# MultithreadedGeneratorUDP
## генератор высокоскоростного UDP-трафика

https://tracker.yandex.ru/ECOLITESOFTT-150

- поток до 100...200 Gbit
- UDP трафик на порты 40000..40024

## структура программы

- JS
    - `js/` компонент верхнего уровня (Node.js)
- C++
    - `inc/` заголовочные файлы С++ (декларация типов, интерфейс)
    - `src/` исходный код компонента нижнего уровня (генерация трафика pcpp/DPDK)
- скрипты сборки
    - `mk/` GNU Make
        - `Makefile`
    - `cmake/`
        - `CMakeLists.txt`
        - `CMakePresets.json`
- `doc/` документация
- `.vscode/` рекомендованные настройки VSCode
