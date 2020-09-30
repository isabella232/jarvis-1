#!/bin/bash
TYPES_TO_JSON_SCHEMA=(
  'src/jest/common/helpers.ts:CoverageData:src/jest/common/coverage-schema.json'
  'src/jest/jest-grouped-coverage/groupData.ts:Config:src/jest/jest-grouped-coverage/config-schema.json'
)

for entry in ${TYPES_TO_JSON_SCHEMA[@]};
do
  FILE=$(echo $entry | cut -d':' -f1)
  TYPE=$(echo $entry | cut -d':' -f2)
  OUTPUT=$(echo $entry | cut -d':' -f3)

  npx ts-json-schema-generator --path $FILE --type $TYPE -o $OUTPUT --no-top-ref --no-type-check
done
