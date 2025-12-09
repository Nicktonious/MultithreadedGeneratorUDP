JSONS = $(wildcard etc/*.json)
ZIPS  = $(wildcard data/*.7z)

# bin/$(BINFILE): $(C) $(H) $(CP) $(HP) $(MK) $(CM) $(P) $(S) $(J) $(JSONS) $(ZIPS)
# 	cmake --fresh --preset linux
# 	cmake --build --preset linux -j
