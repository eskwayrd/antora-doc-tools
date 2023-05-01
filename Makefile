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

# Docker available?
CHECK_CMD = $(if $(shell command -v $(1)),true,false)
HAS_DOCKER := $(call CHECK_CMD,docker)

# Determine current directory.
PWD := $(ifeq ($(UNAME), Windows),$(shell echo %cd%),$(shell pwd))

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
	@rm -rf ${buildDir} tmp ${uiBundlePath}
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
## @param LOCAL=true Only check local links.
links: ${buildDir}/index.html
ifeq (true,$(HAS_DOCKER))
	@echo "${heading}Checking HTML links...${r}"
ifdef LOCAL
	@docker run --rm -l error -v $(PWD)/$(buildDir):/test -v $(PWD)/adt/htmltest:/config wjdp/htmltest -c /config/config.yml -s /test
else
	@docker run --rm -l error -v $(PWD)/$(buildDir):/test -v $(PWD)/adt/htmltest:/config wjdp/htmltest -c /config/config.yml /test
endif
else
	@echo "${alert}Link checking disabled because Docker is not available!${r}"
endif

.PHONY: vale
## Run vale, a spell+language checker:
## - https://github.com/errata-ai/vale
## - https://vale.sh/docs/vale-cli/installation/
vale: ${buildDir}/index.html
ifeq (true,$(HAS_DOCKER))
	@echo "${heading}Checking for spelling/language issues in HTML...${r}"
	docker run --rm -v $(PWD):/docs -w /docs jdkato/vale ${buildDir}
# ifdef (QUICK)
# 	@node adt/bin/vale_modified_files.js
else
	@echo "${alert}Spelling/language checks disabled because Docker is not available!${r}"
endif


# ---------------------------------------------------------------------
## @section Utility targets

.PHONY: clean
## Remove temporary build artifacts
clean:
	@echo "${heading}Cleaning build artifacts...${r}"
	rm -rf ${buildDir}

.PHONY: updateadt
## Update ADT by removing it and reinstalling
updateadt:
	@echo "${heading}Updating ADT...${r}"
	rm -rf adt ${buildDir} Makefile node_modules package-lock.json
	npm i --install-links

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
