import mongoose from "mongoose";

// Form field configuration schema
const fieldConfigSchema = new mongoose.Schema({
    fieldId: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        required: true,
    },
    placeholder: {
        type: String,
        default: "",
    },
    type: {
        type: String,
        enum: ["text", "number", "email", "textarea", "dropdown", "slider", "buttons"],
        default: "text",
    },
    required: {
        type: Boolean,
        default: false,
    },
    visible: {
        type: Boolean,
        default: true,
    },
    gridSpan: {
        type: Number,
        default: 1, // 1 = half width, 2 = full width
        min: 1,
        max: 2,
    },
    order: {
        type: Number,
        default: 0,
    },
    constraints: {
        maxLength: { type: Number, default: null },
        minLength: { type: Number, default: null },
        min: { type: Number, default: null },
        max: { type: Number, default: null },
        step: { type: Number, default: null },
        pattern: { type: String, default: null },
        patternMessage: { type: String, default: null },
    },
    options: [{
        value: String,
        label: String,
    }],
    inputMode: {
        type: String,
        enum: ["text", "numeric", "email", "tel", null],
        default: null,
    },
    autoCapitalize: {
        type: String,
        enum: ["none", "words", "characters", "uppercase", null],
        default: null,
    },
});

// Change history entry schema
const changeHistorySchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "customers",
    },
    userName: {
        type: String,
        default: "",
    },
    action: {
        type: String,
        enum: ["edit", "delete", "restore", "create"],
        required: true,
    },
    fieldId: {
        type: String,
        required: true,
    },
    before: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    after: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
});

// Main form config schema
const formConfigSchema = new mongoose.Schema(
    {
        pageId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        pageName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "",
        },
        fields: [fieldConfigSchema],
        changeHistory: [changeHistorySchema],
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "customers",
        },
        lastModifiedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Default field configs for Add Vendor page (matches CompanySection.tsx)
export const DEFAULT_ADD_VENDOR_FIELDS = [
    {
        fieldId: "companyName",
        label: "Company Name",
        placeholder: "Enter company name",
        type: "text",
        required: true,
        visible: true,
        gridSpan: 1,
        order: 1,
        constraints: { maxLength: 60, minLength: 1 },
    },
    {
        fieldId: "contactPersonName",
        label: "Contact Person",
        placeholder: "Enter contact person name",
        type: "text",
        required: true,
        visible: true,
        gridSpan: 1,
        order: 2,
        constraints: { maxLength: 30, minLength: 1 },
        autoCapitalize: "uppercase",
    },
    {
        fieldId: "vendorPhoneNumber",
        label: "Phone Number",
        placeholder: "10-digit phone number",
        type: "text",
        required: true,
        visible: true,
        gridSpan: 1,
        order: 3,
        constraints: { maxLength: 10, minLength: 10, pattern: "^[1-9][0-9]{9}$", patternMessage: "Must be 10 digits, cannot start with 0" },
        inputMode: "numeric",
    },
    {
        fieldId: "vendorEmailAddress",
        label: "Email Address",
        placeholder: "email@example.com",
        type: "email",
        required: true,
        visible: true,
        gridSpan: 1,
        order: 4,
        constraints: {},
    },
    {
        fieldId: "gstin",
        label: "GST Number",
        placeholder: "15-character GST number",
        type: "text",
        required: false,
        visible: true,
        gridSpan: 1,
        order: 5,
        constraints: { maxLength: 15, minLength: 15, pattern: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", patternMessage: "Must be valid 15-char GSTIN" },
        autoCapitalize: "uppercase",
    },
    {
        fieldId: "subVendor",
        label: "Sub Transporter",
        placeholder: "Enter sub vendor (optional)",
        type: "text",
        required: false,
        visible: true,
        gridSpan: 1,
        order: 6,
        constraints: { maxLength: 20 },
        autoCapitalize: "uppercase",
    },
    {
        fieldId: "vendorCode",
        label: "Transporter Code",
        placeholder: "Enter vendor code (optional)",
        type: "text",
        required: false,
        visible: true,
        gridSpan: 1,
        order: 7,
        constraints: { maxLength: 20, pattern: "^[A-Za-z0-9]*$", patternMessage: "Only letters and numbers allowed" },
        autoCapitalize: "uppercase",
    },
    {
        fieldId: "pincode",
        label: "Pincode",
        placeholder: "6-digit pincode",
        type: "text",
        required: true,
        visible: true,
        gridSpan: 1,
        order: 8,
        constraints: { maxLength: 6, minLength: 6, pattern: "^[0-9]{6}$", patternMessage: "Must be exactly 6 digits" },
        inputMode: "numeric",
    },
    {
        fieldId: "address",
        label: "Address",
        placeholder: "Enter complete address",
        type: "textarea",
        required: true,
        visible: true,
        gridSpan: 2,
        order: 9,
        constraints: { maxLength: 150, minLength: 1 },
    },
    {
        fieldId: "state",
        label: "State",
        placeholder: "State (auto-filled)",
        type: "text",
        required: true,
        visible: true,
        gridSpan: 1,
        order: 10,
        constraints: {},
    },
    {
        fieldId: "city",
        label: "City",
        placeholder: "City (auto-filled)",
        type: "text",
        required: true,
        visible: true,
        gridSpan: 1,
        order: 11,
        constraints: {},
    },
    {
        fieldId: "serviceMode",
        label: "Service Mode",
        placeholder: "",
        type: "buttons",
        required: true,
        visible: true,
        gridSpan: 1,
        order: 12,
        constraints: {},
        options: [
            { value: "FTL", label: "FTL" },
            { value: "LTL", label: "LTL" },
        ],
    },
    {
        fieldId: "companyRating",
        label: "Company Rating",
        placeholder: "",
        type: "slider",
        required: true,
        visible: true,
        gridSpan: 1,
        order: 13,
        constraints: { min: 1, max: 5, step: 0.1 },
    },
];

export default mongoose.model("formConfigs", formConfigSchema);
