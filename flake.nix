{
  description = "Commodity chain management and accounting on Holochain";

  inputs = {
    holochain-nix-versions.url  = "github:holochain/holochain/?dir=versions/weekly";
    holochain-flake = {
      url = "github:holochain/holochain";
      inputs.versions.follows = "holochain-nix-versions";
    };

    nixpkgs.follows = "holochain-flake/nixpkgs";
    flake-parts.follows = "holochain-flake/flake-parts";
  };

  outputs = inputs:
    inputs.flake-parts.lib.mkFlake
      {
        inherit inputs;
      }
      {
        systems = builtins.attrNames inputs.holochain-flake.devShells;
        perSystem =
          { inputs'
          , config
          , pkgs
          , system
          , ...
          }: {
            devShells.default = pkgs.mkShell {
              inputsFrom = [ inputs'.holochain-flake.devShells.holonix ];
              packages = with pkgs; [
                nodejs-18_x
                nodePackages.pnpm
              ];
              GIO_MODULE_DIR="${pkgs.glib-networking}/lib/gio/modules/";
            };
          };
      };
}
