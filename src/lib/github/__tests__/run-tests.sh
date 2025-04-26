#!/bin/bash
# Script to run tests with special tsconfig
cd "$(dirname "$0")"
cd ../../../..
npx tsc --noEmit --project src/lib/github/__tests__/tsconfig.test.json
if [ $? -eq 0 ]; then
  echo "TypeScript check passed!"
  npm test src/lib/github/__tests__/repositories.test.ts
else
  echo "TypeScript check failed!"
  exit 1
fi