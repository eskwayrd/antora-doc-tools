# antora-doc-tools

[CAUTION]
=========
Antora search has matured notably since this repo was created.
**This repo is no longer maintained, and has been archived for posterity.**

You should use the https://gitlab.com/antora/antora-lunr-extension[`antora-lunr`] extension with Antora 3.1.x for your Antora-generated documentation search needs.
=========

Tools for building documentation with Antora.

## Concept

You have a repo containing an Antora-compatible folder structure holding
Asciidoc documentation source. You add a `package.json` that adds this
repo/package as a dependency. Then you get:

- local install of Antora
- CI checks for Asciidoc source
- Spell/language checks with Vale
- A
- Link checks with `html-test`
- Build coordination with `grunt`

## Assumptions

Your documentation repo contains:

- A `docs` folder holding all Asciidoc content in an Antora-compatible
  folder structure.
- An Antora playbook file called `antora-playbook.yml`.
- A `package.json` file.
- Antora-generated HTML lives in the (replaceable) `build` folder.

## Installation

1. Install `antora-doc-tools`:

   ```
   npm i https://github.com/eskwayrd/antora-doc-tools
   ```

After successful installation, all of the tools are placed in the `adt`
folder.

## Tools

The tools are a collection of one-off Node.js scripts, Antora and
Asciidoctor extensions, plus Go binaries. `make` is used for build
coordination.

```
make build
```

Run `make help` to display documentation for the available targets.


## Contributing

Fork, edit, create pull request.

PR is likely to be sporadic. Please have patience. Feel free to ping me
if you think it's taking too long, but wait at least a week before doing
so.

## License

TBD: Currently ISC. Will likely change.
