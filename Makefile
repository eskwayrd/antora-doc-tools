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

buildDir := build

.PHONY: help
help:
	@MAKEFILES="$(MAKEFILE_LIST)" ./generate_makefile_help.sh

.PHONY: helpjs
helpjs:
	@MAKEFILES="$(MAKEFILE_LIST)" ./adt/generate_makefile_help.js

.PHONY: links
## Run htmltest to validate HTML links
links:
	@echo "${heading}Checking HTML links...${r}"
ifdef EXTERNAL
	adt/bin/htmltest -c adt/htmltest-external.yml ${buildDir}
else
	adt/bin/htmltest -c adt/htmltest.yml ${buildDir}
endif

.PHONY: vale
## Run vale, a spell+language checker
vale:
	@echo "${heading}Checking for spelling/language issues in HTML...${r}"
	adt/bin/vale --config adt/vale/vale.ini ${buildDir}


.PHONY: colorize
## Show all the colors.
## It's a long way to the bottom.
## @param FRED=1.2.3.4 FRED controls what free sees.
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
