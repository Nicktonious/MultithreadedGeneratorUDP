.PHONY: doc
doc:
	rsync -r $(HOME)/metadoc/$(APP)/ doc/$(APP)/

.PHONY: doxy
doxy: .doxygen doc/DoxygenLayout.xml doc/logo.png doc
	rm -rf doc/html ; doxygen $< 1>/dev/null
