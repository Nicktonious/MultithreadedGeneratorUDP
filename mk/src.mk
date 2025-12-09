# .mk files
MK += Makefile $(wildcard mk/*.mk)

# cmake files
CM += CMake* $(wildcard cmake/*.cmake)

# C/C++
C  += $(wildcard src/*.c*)
H  += $(wildcard inc/*.h*)
LX += $(wildcard src/*.lex src/*.yacc src/*.ragel)
# libs
C  += $(wildcard lib/src/*.c*) $(wildcard lib/*/src/*.c*)
H  += $(wildcard lib/inc/*.h*) $(wildcard lib/*/inc/*.h*)

# ini
S  += $(wildcard lib/*.ini) $(wildcard lib/*.f)
S   = $(wildcard etc/*.json)

# OCaml
M += $(wildcard lib/*.ml*)

# Python
P += $(wildcard src/*.py) $(wildcard lib/*.py)

# JavaScript
J += $(wildcard js/*.*js)
