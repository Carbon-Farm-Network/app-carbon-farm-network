#!/bin/bash

# Function to get the latest version of a package from npm
get_latest_version() {
  npm show "$1" version
}

# Packages to update
packages=(
  "@leosprograms/graphql-client-holochain"
  "@leosprograms/vf-graphql-holochain"
)

# Path to the package.json file
package_json_path="ui/package.json"

# Backup the original package.json
cp "$package_json_path" "$package_json_path.bak"

# Update each package to the latest version
for package in "${packages[@]}"; do
  latest_version=$(get_latest_version "$package")
  if [ -n "$latest_version" ]; then
    # Use jq to update the package version in package.json
    jq --arg package "$package" --arg version "$latest_version" \
      '.dependencies[$package] = $version' \
      "$package_json_path" > "$package_json_path.tmp" && mv "$package_json_path.tmp" "$package_json_path"
  else
    echo "Failed to get the latest version for $package"
  fi
done

# Install dependencies using pnpm
npm install