export enum LabelConfigType {
    Static = "static",
    Dynamic = "dynamic",
    OneOf = "oneOf",
    Filter = "filter",
}

export class LabelConfig {
    label: string;
    operator: string;
    value: string | undefined;
    priority: number;
    type: string;
    isStatic: boolean;
    values: string | undefined;
    constructor(public config: {
        label: string,
        operator: string,
        value?: string,
        values?: string,
        priority: number,
        type: string,
        isStatic: boolean,
    }) {
        this.label = config.label;
        this.operator = config.operator;
        this.value = config.value;
        this.values = config.values;
        this.priority = config.priority;
        this.type = config.type;
        this.isStatic = config.isStatic;
    }
}
