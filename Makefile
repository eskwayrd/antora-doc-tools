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

.PHONY: help
help:
	@MAKEFILES="$(MAKEFILE_LIST)" ./adt/generate_makefile_help.js


# ---------------------------------------------------------------------
## @section Build targets

#	@echo ${SOURCES}
${buildDir}/index.html: ${SOURCES}
	@echo "${heading}Building the documentation HTML...${r}"
	npx antora --fetch antora-playbook.yml
	@touch -m ${buildDir}/index.html

.PHONY: docs
## Build HTML for the documentation with Antora:
## - https://antora.org/
## - https://docs.antora.org/antora/latest/
docs: ${buildDir}/index.html

.PHONY: preview
## Build the documentation HTML and start a web server to view it.
preview: docs serve


# ---------------------------------------------------------------------
## @section Validation targets

.PHONY: links
## Run htmltest to validate HTML links:
## - https://github.com/wjdp/htmltest
## @param EXTERNAL=true Check external links too.
links:
	@echo "${heading}Checking HTML links...${r}"
ifdef EXTERNAL
	adt/bin/htmltest -c adt/htmltest-external.yml ${buildDir}
else
	adt/bin/htmltest -c adt/htmltest.yml ${buildDir}
endif

.PHONY: vale
## Run vale, a spell+language checker:
## - https://github.com/errata-ai/vale
## - https://vale.sh/docs/vale-cli/installation/
vale:
	@echo "${heading}Checking for spelling/language issues in HTML...${r}"
	adt/bin/vale --config adt/vale/vale.ini ${buildDir}


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
serve:
	@echo "${heading}Starting web server...${r}"
	npx http-server ./${builddir} -r -x-1 -g


.PHONY: colorize
## Show all the colors.
## It's a long way to the bottom.
## @param FRED=1.2.3.4 FRED controls what fred sees.
## @param BOB=4.3.2 BOB cannot see anything.
color:
	echo "${b}BLACKISH${r}"
	echo "${BLACK}BLACK${RESET}"
	echo "${RED}RED${RESET}"
	echo "${GREEN}GREEN${RESET}"
	echo "${YELLOW}YELLOW${RESET}"
	echo "${LIGHTPURPLE}LIGHTPURPLE${RESET}"
	echo "${PURPLE}PURPLE${RESET}"
	echo "${BLUE}BLUE${RESET}"
	echo "${WHITE}WHITE${RESET}"
