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
    in
    {
      overlays = [ devshell.overlays.default ];
      devShell = forAllSystems
        (system:
          let
            pkgs = nixpkgsFor.${system};
          in
          pkgs.devshell.mkShell {
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
            ];
          }
        );

    };
}