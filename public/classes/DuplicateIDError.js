class DuplicateIDError extends Error {
    constructor(message, options = {}){
        super(message, options);
    }
}