{ pkgs ? (import ../../../build_tools/pinned_nixpkgs.nix).pkgs }:

let
  fs = pkgs.lib.fileset;

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

