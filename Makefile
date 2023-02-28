# Makefile for Antora documentation projects

# define standard colors
b       := $(shell tput bold)
black   := $(shell tput setaf 0)
red     := $(shell tput setaf 1)
green   := $(shell tput setaf 2)
yellow  := $(shell tput setaf 3)
blue    := $(shell tput setaf 4)
magenta := $(shell tput setaf 5)
cyan    := $(shell tput setaf 6)
white   := $(shell tput setaf 7)
r       := $(shell tput sgr0)
heading := $(b)$(cyan)

docsDir := docs
buildDir := build
SOURCES := $(shell find ${docsDir} -type f -name '*.adoc')


# ---------------------------------------------------------------------
## @section Build targets

.PHONY: docs
## Build the documentation, run the checks, then preview the site.
docs: html checks preview

.PHONY: html
## Build HTML for the documentation with Antora:
## - https://antora.org/
## - https://docs.antora.org/antora/latest/
html: ${buildDir}/index.html

.PHONY: preview
## Build the documentation HTML and start a web server to view it.
preview: docs serve

#	@echo ${SOURCES}
${buildDir}/index.html: ${SOURCES}
	@echo "${heading}Building the documentation HTML...${r}"
	npx antora --fetch antora-playbook.yml
	@touch -m ${buildDir}/index.html


# ---------------------------------------------------------------------
## @section Validation targets

.PHONY: checks
## Runs all of the check targets.
checks: links vale

.PHONY: links
## Run htmltest to validate HTML links:
## - https://github.com/wjdp/htmltest
## @param EXTERNAL=true Check external links too.
links: html
	@echo "${heading}Checking HTML links...${r}"
ifdef EXTERNAL
	adt/bin/htmltest -c adt/htmltest/config-external.yml ${buildDir}
else
	adt/bin/htmltest -c adt/htmltest/config.yml ${buildDir}
endif

.PHONY: vale
## Run vale, a spell+language checker:
## - https://github.com/errata-ai/vale
## - https://vale.sh/docs/vale-cli/installation/
vale: html
	@echo "${heading}Checking for spelling/language issues in HTML...${r}"
ifdef (QUICK)
	@node adt/bin/vale_modified_files.js
else
	@adt/bin/vale --config adt/vale/vale.ini ${buildDir}
endif


# ---------------------------------------------------------------------
## @section Utility targets

.PHONY: clean
## Remove temporary build artifacts
clean:
	@echo "${heading}Cleaning build artifacts...${r}"
	rm -rf build

.PHONY: removeadt
## Remove ADT and temporary build artifacts
removeadt:
	@echo "${heading}Removing ADT and build artifacts...${r}"
	rm -rf adt build node_modules

.PHONY: serve
## Start a web server to preview the documentation.
serve: html
	@echo "${heading}Starting web server...${r}"
	npx http-server ./${builddir} -r -x-1 -g

.PHONY: help
help:
	@MAKEFILES="$(MAKEFILE_LIST)" ./adt/generate_makefile_help.js
