.PHONY: doc
doc:
	rsync -r $(HOME)/metadoc/$(APP)/ doc/

.PHONY: doxy
doxy: .doxygen doc/DoxygenLayout.xml doc/logo.png
	rm -rf doc/html ; doxygen $< 1>/dev/null
