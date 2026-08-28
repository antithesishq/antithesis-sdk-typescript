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
      ./vitest.config.ts
    ];
  };

  build = pkgs.buildNpmPackage {
    inherit src;
    name = "antithesis-javascript-sdk";
    npmDeps = pkgs.importNpmLock {
      npmRoot = src;
    };
    npmConfigHook = pkgs.importNpmLock.npmConfigHook;
    doCheck = true;
    checkPhase = ''
      runHook preCheck
      npm test
      runHook postCheck
    '';
  };
in {
  inherit build;
}

