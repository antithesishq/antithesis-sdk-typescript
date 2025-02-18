{ pkgs ? (import ../../../build_tools/pinned_nixpkgs.nix).pkgs }:

let
  nodeTools = pkgs.callPackage ../../../build_tools/nodejs {};
  fs = pkgs.lib.fileset;

  # version = (builtins.fromJSON (builtins.readFile ./package.json)).version;

  # build = let
  #   package = (pkgs.callPackage ./package.nix {
  #     inherit pkgs;
  #     nodejs = nodeTools.nodejs;
  #   });
  #   devDependencies = package.devBuild.nodeDependencies.override (old: {
  #     buildInputs = old.buildInputs ++ ( with pkgs; [ pkg-config vips pixman cairo pango ]);
  #   });
  #   prodDependencies = package.prodBuild.nodeDependencies;
    # source = fs.toSource {
    #   root = ./.;
    #   fileset = fs.unions [
    #     ./src
    #     ./package.json
    #     ./tsconfig.json
    #   ];
    # };
  # in (nodeTools.buildTypescript {
  #   inherit devDependencies prodDependencies source;
  # }).build;

  src = fs.toSource {
    root = ./.;
    fileset = fs.unions [
      ./src
      ./package.json
      ./package-lock.json
      ./tsconfig.json
    ];
  };

  build = pkgs.buildNpmPackage {
    inherit src;
    name = "antithesis-javascript-sdk";
    npmDeps = pkgs.importNpmLock {
      npmRoot = src;
    };
    npmConfigHook = pkgs.importNpmLock.npmConfigHook;
  };
in {
  inherit build;
}

