import { gql } from 'graphql-tag'

export const RECIPE_FLOW_CORE_FIELDS = gql`
    fragment RecipeFlowCoreFields on RecipeFlow {
        id
        revisionId
        name
        note
        providerRole
        receiverRole
        instructions
        stage {
            id
            name
        }
        action {
            id
            symbol
            label
        }
        resourceQuantity {
            hasNumericalValue
            hasUnit {
                id
                label
            }
        }
        resourceConformsTo {
            id
            name   
        }
        resourceConformsTo {
            id
            name
        }
    }
    `

export const RECIPE_PROCESS_CORE_FIELDS = gql`
    fragment RecipeProcessCoreFields on RecipeProcess {
        id
        revisionId
        name
        note
        basedOn {
            id
            name
            image
        }
        processConformsTo {
            id
            revisionId
            name
            image
        }
    }
    `

export const RECIPE_EXCHANGE_CORE_FIELDS = gql`
    fragment RecipeExchangeCoreFields on RecipeExchange {
        id
        revisionId
        name
        note
        basedOn {
            id
            name
            image
        }
        processConformsTo {
            id
            revisionId
            name
            image
        }
    }
    `

export const RECIPE_RETURN_FIELDS = gql`
    ${RECIPE_PROCESS_CORE_FIELDS}
    ${RECIPE_FLOW_CORE_FIELDS}
    fragment RecipeFields on RecipeProcess {
        ...RecipeProcessCoreFields
        recipeInputs {
           ...RecipeFlowCoreFields
        }
        recipeOutputs {
            ...RecipeFlowCoreFields
        }
    }
    `


export const RECIPE_EXCHANGE_RETURN_FIELDS = gql`
    ${RECIPE_EXCHANGE_CORE_FIELDS}
    ${RECIPE_FLOW_CORE_FIELDS}
    fragment RecipeExchangeFields on RecipeExchange {
        ...RecipeExchangeCoreFields
        recipeClauses {
            ...RecipeFlowCoreFields
        }
        recipeReciprocalClauses {
            ...RecipeFlowCoreFields
        }
    }
    `