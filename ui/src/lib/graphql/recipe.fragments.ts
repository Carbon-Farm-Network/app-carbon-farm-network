import { gql } from 'graphql-tag'

export const RECIPE_FLOW_CORE_FIELDS = gql`
    fragment RecipeFlowCoreFields on RecipeFlow {
        id
        revisionId
        note
    }
    `

export const RECIPE_PROCESS_CORE_FIELDS = gql`
    fragment RecipeProcessCoreFields on RecipeProcess {
        id
        revisionId
        name
        note
        processConformsToId
    }
    `

export const RECIPE_EXCHANGE_CORE_FIELDS = gql`
    fragment RecipeExchangeCoreFields on RecipeExchange {
        id
        revisionId
        name
        note
    }
    `

export const RECIPE_RETURN_FIELDS = gql`
    fragment RecipeFields on RecipeProcess {
        id
        revisionId
        name
        note
        processConformsToId
        recipeInputs {
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
        recipeOutputs {
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
    }
    `


export const RECIPE_EXCHANGE_RETURN_FIELDS = gql`
    fragment RecipeExchangeFields on RecipeExchange {
        id
        revisionId
        name
        note
        processConformsToId
        recipeClauses {
            id
            revisionId
            name
            note
            providerRole
            receiverRole
            stage {
                id
                name
            }
            action {
                id
                label
            }
            resourceConformsTo {
                id
                name   
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
        }
        recipeReciprocalClauses {
            id
            revisionId
            name
            note
            providerRole
            receiverRole
            stage {
                id
                name
            }
            action {
                id
                label
            }
            resourceConformsTo {
                id
                name   
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
        }
    }
    `