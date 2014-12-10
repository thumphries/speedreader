DIST=dist
SCRIPT=src/speedreader.user.js
GMDIR=greasemonkey
FFDIR=firefox
FFSDK=$(FFDIR)/addon-sdk

firefox: $(SCRIPT) $(FFDIR)/lib/main.js $(FFDIR)/package.json
	if [ -d $(FFDIR)/addon-sdk ]; then \
	cd $(FFSDK) && source bin/activate && \
        cd .. && cfx xpi && mv *.xpi ../$(DIST) ; \
	else echo "Error: could not find $(FFDIR)/addon-sdk"; fi

greasemonkey-ff: $(SCRIPT) $(GMDIR)/header.js  $(GMDIR)/firefox.js
	cat $(GMDIR)/header.js $(SCRIPT)  $(GMDIR)/firefox.js > $(DIST)/gmff.js


