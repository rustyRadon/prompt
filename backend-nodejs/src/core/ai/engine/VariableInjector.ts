export interface VariableMap {
  [key: string]: string | number | boolean;
}

export class VariableInjector {
  /**
   * Replaces {{variable}} placeholders in XML content with actual values
   * ONLY handles placeholder replacement - NO logic or processing
   */
  static inject(xmlContent: string, variables: VariableMap): string {
    let result = xmlContent;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return result;
  }

  /**
   * Extracts all {{variable}} placeholders from content
   */
  static extractPlaceholders(xmlContent: string): string[] {
    const matches = xmlContent.match(/{{(\w+)}}/g);
    if (!matches) return [];

    return matches.map(match => match.slice(2, -2)); // Remove {{ and }}
  }

  /**
   * Validates that all required variables are provided
   */
  static validate(xmlContent: string, variables: VariableMap): {
    valid: boolean;
    missing: string[];
  } {
    const required = this.extractPlaceholders(xmlContent);
    const missing = required.filter(varName => !(varName in variables));

    return {
      valid: missing.length === 0,
      missing
    };
  }
}
