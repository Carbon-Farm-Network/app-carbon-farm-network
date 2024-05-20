# Carbon Farm Network

## Environment Setup

> PREREQUISITE: set up the [holochain development environment](https://developer.holochain.org/docs/install/).

Enter the nix shell by running this in the root folder of the repository, then install Nodejs dependencies:

```bash
nix develop
pnpm install
```

There is currently no published release for the [Holochain Facets](https://github.com/Carbon-Farm-Network/holochain-facets/) module. You will need to download and build it yourself:

	git clone git@github.com:Carbon-Farm-Network/holochain-facets.git
	cd holochain-facets
	CARGO_TARGET_DIR=target cargo build --release --target wasm32-unknown-unknown

You should now have a built DNA bundle at `holochain-facets/dnas/hc_facets/workdir/hc_facets.dna`. Copy it into the `/workdir` of this repository.

Note that you can also use this method to build custom versions of other Holochain DNA modules (eg. hREA components). Otherwise all necessary DNA dependencies are downloaded by the workspace `postinstall` script.

**Run all the other instructions in this README from inside this nix-shell, otherwise they won't work**.

## Running 2 agents

```bash
npm start
```

This will create a network of 2 nodes connected to each other and their respective UIs.
It will also bring up the Holochain Playground for advanced introspection of the conductors.

## Running the backend tests

```bash
npm test
```

## Bootstrapping a network

Create a custom network of nodes connected to each other and their respective UIs with:

```bash
AGENTS=3 npm run network
```

Substitute the "3" for the number of nodes that you want to bootstrap in your network.
This will also bring up the Holochain Playground for advanced introspection of the conductors.

## Packaging

To package the web happ:
``` bash
npm run package
```

You'll have the `acfn.webhapp` in `workdir`. This is what you should distribute so that the Holochain Launcher can install it.
You will also have its subcomponent `acfn.happ` in the same folder`.

## Advanced usage

There are times when it becomes useful to link development versions of dependencies into this repo (eg. when developing new features for hREA).

### Linking Nodejs modules for development

You can use `pnpm link PATH/TO/LOCAL/MODULE/DIR` to override some module from the registry with a modified local copy. The target directory must reference the *packaged* version of a module as it would be delivered from an NPM registry, rather than any development artifacts. (For hREA's modules this means referencing the `build` subdirectory of each of its `/modules` folders after a successful `npm run build:graphql` script execution.)

The caveat is that development versions of the app served through [Vite](http://vite.dev/) will crash when attempting to load such linked modules. Prepend a colon-separated list of any additional module dirs to all commands executed via the `ADDITIONAL_MODULE_DIRS` environment variable. For example:

	ADDITIONAL_MODULE_DIRS=/PATH/TO/MODULE/1:/PATH/TO/MODULE/2 npm run dev

## Documentation

This repository is organised via the utilisation of these tools:

- [Nix Flakes](https://nixos.wiki/wiki/Flakes): Management of infrastructural dependencies.
- [PNPM Workspaces](https://pnpm.io/workspaces): PNPM's package manager handles monorepos and complex cross-repo development setups gracefully.
- [hc](https://github.com/holochain/holochain/tree/develop/crates/hc): Holochain CLI to easily manage Holochain development instances.
- [@holochain/tryorama](https://www.npmjs.com/package/@holochain/tryorama): test framework; see `/tests`.
- [@holochain-playground/cli](https://www.npmjs.com/package/@holochain-playground/cli): introspection tooling to understand what's going on in the Holochain nodes.

## To do

- [ ] fix the modals for the clickoutside action, only the facets modal has it working properly

## Legal

Copyright 2023-2024 Leo Bensman, Raphael Megzari, pospi, Lynn Foster

This file is part of Carbon Farm Network.

Carbon Farm Network is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

Carbon Farm Network is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Carbon Farm Network. If not, see <https://www.gnu.org/licenses/>. 
