# Makefile for Antora documentation projects

# platform determination
ifeq '$(findstring ;,$(PATH))' ';'
  UNAME := Windows
else
  UNAME := $(shell uname 2>/dev/null || echo Unknown)
  UNAME := $(patsubst CYGWIN%,Cygwin,$(UNAME))
  UNAME := $(patsubst MSYS%,MSYS,$(UNAME))
  UNAME := $(patsubst MINGW%,MSYS,$(UNAME))
endif

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
alert   := $(b)$(yellow)

# define paths
docsDir       := docs
buildDir      := $(shell adt/get_pbv.js output.dir)
uiBundleRepo  := $(shell adt/get_pbv.js asciidoc.attributes.ui_bundle_repo)
uiBundlePath  := $(shell adt/get_pbv.js ui.bundle.url)
SOURCES       := $(shell find ${docsDir} -type f -name '*.adoc')
SOURCES += antora-playbook.yml


# ---------------------------------------------------------------------
## @section Build targets

.PHONY: docs
## Build the documentation, run the checks, then preview the site.
## @param FORCE=true Force HTML generation.
docs: html checks preview

.PHONY: html
## Build HTML for the documentation with Antora:
## - https://antora.org/
## - https://docs.antora.org/antora/latest/
## @param FORCE=true Force HTML generation.
html: force getui ${buildDir}/index.html

.PHONY: preview
## Build the documentation HTML and start a web server to view it.
preview: docs serve

.PHONY: force
force:
ifdef FORCE
	@rm -rf ${buildDir} tmp
	@rm ${uiBundlePath}
endif

.PHONY: getui
## Downloads the eCourt UI from a GitHub release asset
## Requires an authenticated GitLab CI!
getui:
ifneq (,${uiBundleRepo})
	@echo "${heading}Fetching the UI bundle release asset...${r}"
	@adt/download_ui.js
endif

#	@echo ${SOURCES}
${buildDir}/index.html: ${SOURCES}
	@echo "${heading}Building the documentation HTML...${r}"
	@rm -rf ${buildDir}
	npx antora --stacktrace --fetch antora-playbook.yml
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
links: ${buildDir}/index.html
ifeq ($(UNAME), Windows)
	@echo "${alert}Cannot check HTML links, skipping...${r}"
else
	@echo "${heading}Checking HTML links...${r}"
ifdef EXTERNAL
	adt/bin/htmltest -c adt/htmltest/config-external.yml ${buildDir}
else
	adt/bin/htmltest -c adt/htmltest/config.yml ${buildDir}
endif
endif

.PHONY: vale
## Run vale, a spell+language checker:
## - https://github.com/errata-ai/vale
## - https://vale.sh/docs/vale-cli/installation/
vale: ${buildDir}/index.html
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
serve: force html
	@echo "${heading}Starting web server...${r}"
	npx http-server ./${buildDir} -r -x-1 -g

.PHONY: test
## Run the extension tests.
test:
	@echo "${heading}Running tests...${r}"
	npx ava adt/tests

.PHONY: help
help:
	@MAKEFILES="$(MAKEFILE_LIST)" ./adt/generate_makefile_help.js
