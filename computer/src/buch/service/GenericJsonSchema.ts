// https://github.com/enriched/ts-json-schema/blob/master/src/JsonSchema.ts
// Alternative JDT = JSON Type Definition
// https://github.com/ajv-validator/ajv/blob/master/docs/json-type-definition.md

interface CustomErrorMessages {
    properties: Record<string, string>;
}

export interface GenericJsonSchema {
    $ref?: string;

    // -------------------------------------------------------------------------
    // Schema Metadata
    // -------------------------------------------------------------------------
    /**
     * This is important because it tells refs where the root of the document is located
     */
    $id?: string;
    /**
     * It is recommended that the meta-schema is included in the root of any json schema and must be a uri
     */
    $schema?: string;
    /**
     * Title of the schema
     */
    title?: string;
    /**
     * Schema description
     */
    description?: string;
    /**
     * Default json for the object represented by this schema
     */
    default?: unknown;

    // -------------------------------------------------------------------------
    // Number Validation
    // -------------------------------------------------------------------------
    /**
     * The value must be a multiple of the number (e.g. 10 is a multiple of 5)
     */
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: number;
    minimum?: number;
    exclusiveMinimum?: number;

    // -------------------------------------------------------------------------
    // String Validation
    // -------------------------------------------------------------------------
    maxLength?: number;
    minLength?: number;
    /**
     * This is a regex string that the value must conform to
     */
    pattern?: string;

    // -------------------------------------------------------------------------
    // Array Validation
    // -------------------------------------------------------------------------
    additionalItems?: GenericJsonSchema | boolean;
    items?: GenericJsonSchema | GenericJsonSchema[];
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;

    // -------------------------------------------------------------------------
    // Object Validation
    // -------------------------------------------------------------------------
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    additionalProperties?: GenericJsonSchema | boolean;
    /**
     * Holds simple JSON Schema definitions for referencing from elsewhere
     */
    definitions?: Record<string, GenericJsonSchema>;
    /**
     * The keys that can exist on the object with the json schema that should validate their value
     */
    properties?: Record<string, GenericJsonSchema>;
    /**
     * The key of this object is a regex for which properties the schema applies to
     */
    patternProperties?: Record<string, GenericJsonSchema>;
    /**
     * If the key is present as a property then the string of properties must also be present.
     * If the value is a JSON Schema then it must also be valid for the object if the key is present.
     */
    dependencies?: Record<string, GenericJsonSchema> | string[];

    // -------------------------------------------------------------------------
    // Generic
    // -------------------------------------------------------------------------
    /**
     * Enumerates the values that this schema can be e.g.
     * \{"type": "string", "enum": \["red", "green", "blue"\]\}
     */
    enum?: unknown[];
    /**
     * The basic type of this schema, can be one of [string, number, object, array, boolean, null] or an array of
     * the acceptable types
     */
    type?: string[] | string;

    format?: string;

    // -------------------------------------------------------------------------
    // Combining Schemas
    // -------------------------------------------------------------------------
    allOf?: GenericJsonSchema[];
    anyOf?: GenericJsonSchema[];
    oneOf?: GenericJsonSchema[];
    /**
     * The entity being validated must not match this schema
     */
    not?: GenericJsonSchema;

    // -------------------------------------------------------------------------
    // Hyperfish Specific
    // -------------------------------------------------------------------------
    viewProperties?: string[];
    component?: string;
    valueSource?: string;
    identifiers?: string[];
    links?: (GenericJsonSchema & { rel: string; href: string })[];

    errorMessage?: CustomErrorMessages;
}
