# .mk files
MK += Makefile $(wildcard mk/*.mk)

# cmake files
CM += CMake* $(wildcard cmake/*.cmake)

# C/C++
C  += $(wildcard src/*.c*)
# C  += $(wildcard cpp/*.c*) $(wildcard cpp/raw__00/*.c*)
H  += $(wildcard inc/*.h*)
# H  += $(wildcard cpp/*.h*) $(wildcard cpp/raw__00/*.h*)
LX += $(wildcard src/*.lex src/*.yacc src/*.ragel)

# ini
S  += $(wildcard lib/*.ini) $(wildcard lib/*.f)
S   = $(wildcard etc/*.json)

# Python
P += $(wildcard src/*.py) $(wildcard lib/*.py)

# JavaScript
J += $(wildcard js/*.*js)
