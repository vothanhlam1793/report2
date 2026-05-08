module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            referenceCode: String,
            invoiceCode: String,
            customerCode: String,
            customerName: String,
            staffUsername: String,
            staffName: String,
            counterpartyType: String,
            counterpartyCode: String,
            counterpartyName: String,
            direction: {
                type: String,
                default: 'expense'
            },
            category: String,
            bank: String,
            code: String,
            amount: Number,
            content: String,
            description: String,
            note: String,
            transactionDate: Date,
            date: Date,
            createdByName: String,
            createdByUsername: String,
            accuracy: {
                type: Boolean,
                default: false
            },
            protected: {
                type: Boolean,
                default: false
            }
        },
        { timestamps: true }
    );
  
    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
  
    const Transaction = mongoose.model("transaction", schema);
    return Transaction;
  };
