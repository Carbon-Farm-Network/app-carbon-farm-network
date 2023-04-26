{
  description = "A devShell example";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    devshell.url = "github:numtide/devshell";
  };

  outputs = { self, nixpkgs, devshell }:
    let
      # taken from https://github.com/ngi-nix/project-template/blob/master/flake.nix
      # System types to support.
      supportedSystems = [ "x86_64-linux" "x86_64-darwin" ];

      # Helper function to generate an attrset '{ x86_64-linux = f "x86_64-linux"; ... }'.
      forAllSystems = f: nixpkgs.lib.genAttrs supportedSystems (system: f system);

      # Nixpkgs instantiated for supported system types.
      nixpkgsFor = forAllSystems (system: import nixpkgs { inherit system; overlays = self.overlays; });
      nixpkgsNoOverlays = forAllSystems (system: import nixpkgs { inherit system; });
    in
    {
      overlays = [ devshell.overlays.default ];
      devShell = forAllSystems
        (system:
          let
            pkgs = nixpkgsFor.${system};
          in
          pkgs.devshell.mkShell {
            packages = [ pkgs.nodePackages_latest.pnpm ];
            env = [
              {
                name = "PATH";
                eval = "/Users/raphael/.cargo/bin:$PATH";
              }
              {
                name = "REACT_APP_HC_APP_ID";
                value = "hrea_suite";
              }
              {
                name = "REACT_APP_HC_CONN_URL";
                value = "ws://localhost:4000";
              }
            ];
            commands = [
              {
                help = "create a holochain sandbox";
                name = "sandbox";
                command = "hc sandbox create -n 1 -d hrea_tester network quic";
              }
              {
                help = "install hrea happ to sandbox";
                name = "install_hrea";
                command = "hc sandbox call install-app-bundle ./hrea_suite.happ";
              }
              {
                help = "start hrea";
                name = "start_hrea";
                command = "hc sandbox run --all --ports 4000";
              }

              {
                name = "clean";
                category = "dev";
                help = "Clean the package manager directory and local direnv";
                command = ''
                  direnv prune
                  pnpm prune
                  pnpm store prune
                '';
              }
              {
                name = "dev";
                category = "dev";
                help = "Start dev server locally";
                command = "pnpm run dev";
              }
              {
                name = "deps_update";
                category = "dev";
                help = "update dependencies";
                command = "pnpm up --interactive --latest";
              }
              {
                name = "build";
                category = "dev";
                help = "build the project for release";
                command = "pnpm run build";
              }
              {
                name = "preview";
                category = "dev";
                help = "preview the release build";
                command = "pnpm run preview";
              }
            ];
          }
        );

    };
}