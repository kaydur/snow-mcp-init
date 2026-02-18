import { ScriptSecurityValidator } from './ScriptSecurityValidator.js';
import { SecurityConfig } from '../types/interfaces.js';

describe('ScriptSecurityValidator', () => {
  let validator: ScriptSecurityValidator;

  beforeEach(() => {
    validator = new ScriptSecurityValidator();
  });

  describe('constructor', () => {
    it('should create validator with default config', () => {
      expect(validator).toBeInstanceOf(ScriptSecurityValidator);
      const config = validator.getConfig();
      expect(config.maxScriptLength).toBe(10000);
      expect(config.blacklistedPatterns.length).toBeGreaterThan(0);
      expect(config.requireConfirmation.length).toBeGreaterThan(0);
    });

    it('should accept custom config', () => {
      const customValidator = new ScriptSecurityValidator({
        maxScriptLength: 5000,
      });
      const config = customValidator.getConfig();
      expect(config.maxScriptLength).toBe(5000);
    });
  });

  describe('validate - script length', () => {
    it('should accept script within length limit', () => {
      const script = 'new GlideQuery("incident").select()';
      const result = validator.validate(script);

      expect(result.safe).toBe(true);
      expect(result.violations).toBeUndefined();
    });

    it('should reject script exceeding maximum length', () => {
      const script = 'a'.repeat(10001);
      const result = validator.validate(script);

      expect(result.safe).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations![0]).toContain('exceeds maximum length');
      expect(result.violations![0]).toContain('10000');
      expect(result.violations![0]).toContain('10001');
    });

    it('should accept script at exactly maximum length', () => {
      const script = 'a'.repeat(10000);
      const result = validator.validate(script);

      // Should pass length check (may fail on other checks if 'a' repeated matches patterns)
      expect(result.violations?.some(v => v.includes('exceeds maximum length'))).toBeFalsy();
    });
  });

  describe('validate - blacklisted patterns', () => {
    it('should detect gs.executeNow', () => {
      const script = 'gs.executeNow("some code")';
      const result = validator.validate(script);

      expect(result.safe).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
    });

    it('should detect gs.eval', () => {
      const script = 'gs.eval("malicious code")';
      const result = validator.validate(script);

      expect(result.safe).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
    });

    it('should detect eval', () => {
      const script = 'eval("malicious code")';
      const result = validator.validate(script);

      expect(result.safe).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
    });

    it('should detect Function constructor', () => {
      const script = 'new Function("return 1")';
      const result = validator.validate(script);

      expect(result.safe).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
    });

    it('should detect GlideRecord usage', () => {
      const script = 'var gr = new GlideRecord("incident")';
      const result = validator.validate(script);

      expect(result.safe).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
    });

    it('should detect file system access patterns', () => {
      const scripts = [
        'file.readLine()',
        'file.write("data")',
        'file.getFile()',
        'file.setFile()',
      ];

      for (const script of scripts) {
        const result = validator.validate(script);
        expect(result.safe).toBe(false);
        expect(result.violations).toBeDefined();
        expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
      }
    });

    it('should detect network request patterns', () => {
      const scripts = [
        'var request = new GlideHTTPRequest()',
        'var rest = new RESTMessageV2()',
        'var soap = new SOAPMessageV2()',
      ];

      for (const script of scripts) {
        const result = validator.validate(script);
        expect(result.safe).toBe(false);
        expect(result.violations).toBeDefined();
        expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
      }
    });

    it('should detect require and import statements', () => {
      const scripts = [
        'require("module")',
        'import something from "module"',
      ];

      for (const script of scripts) {
        const result = validator.validate(script);
        expect(result.safe).toBe(false);
        expect(result.violations).toBeDefined();
        expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
      }
    });

    it('should accept safe GlideQuery script', () => {
      const script = `
        new GlideQuery('incident')
          .where('active', true)
          .where('priority', '<=', 3)
          .select('number', 'short_description')
      `;
      const result = validator.validate(script);

      expect(result.safe).toBe(true);
      expect(result.violations).toBeUndefined();
    });
  });

  describe('validate - dangerous operations', () => {
    it('should detect deleteMultiple', () => {
      const script = 'new GlideQuery("incident").where("active", false).deleteMultiple()';
      const result = validator.validate(script);

      expect(result.dangerousOperations).toBeDefined();
      expect(result.dangerousOperations).toContain('deleteMultiple');
    });

    it('should detect updateMultiple', () => {
      const script = 'new GlideQuery("incident").where("state", 1).updateMultiple({state: 2})';
      const result = validator.validate(script);

      expect(result.dangerousOperations).toBeDefined();
      expect(result.dangerousOperations).toContain('updateMultiple');
    });

    it('should detect disableWorkflow', () => {
      const script = 'new GlideQuery("incident").disableWorkflow().update({state: 6})';
      const result = validator.validate(script);

      expect(result.dangerousOperations).toBeDefined();
      expect(result.dangerousOperations).toContain('disableWorkflow');
    });

    it('should detect disableAutoSysFields', () => {
      const script = 'new GlideQuery("incident").disableAutoSysFields().update({state: 6})';
      const result = validator.validate(script);

      expect(result.dangerousOperations).toBeDefined();
      expect(result.dangerousOperations).toContain('disableAutoSysFields');
    });

    it('should detect forceUpdate', () => {
      const script = 'new GlideQuery("incident").forceUpdate().update({state: 6})';
      const result = validator.validate(script);

      expect(result.dangerousOperations).toBeDefined();
      expect(result.dangerousOperations).toContain('forceUpdate');
    });

    it('should detect multiple dangerous operations', () => {
      const script = `
        new GlideQuery("incident")
          .where("active", false)
          .disableWorkflow()
          .updateMultiple({state: 7})
      `;
      const result = validator.validate(script);

      expect(result.dangerousOperations).toBeDefined();
      expect(result.dangerousOperations).toContain('disableWorkflow');
      expect(result.dangerousOperations).toContain('updateMultiple');
      expect(result.dangerousOperations!.length).toBe(2);
    });

    it('should not flag safe operations as dangerous', () => {
      const script = `
        new GlideQuery('incident')
          .where('active', true)
          .select('number', 'short_description')
      `;
      const result = validator.validate(script);

      expect(result.dangerousOperations).toBeUndefined();
    });

    it('should detect dangerous operations case-insensitively', () => {
      const script = 'new GlideQuery("incident").DELETEMULTIPLE()';
      const result = validator.validate(script);

      expect(result.dangerousOperations).toBeDefined();
      expect(result.dangerousOperations).toContain('deleteMultiple');
    });
  });

  describe('validate - combined violations', () => {
    it('should detect both blacklisted patterns and dangerous operations', () => {
      const script = `
        gs.eval("malicious");
        new GlideQuery("incident").deleteMultiple();
      `;
      const result = validator.validate(script);

      expect(result.safe).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
      expect(result.dangerousOperations).toBeDefined();
      expect(result.dangerousOperations).toContain('deleteMultiple');
    });

    it('should detect length violation with other issues', () => {
      const script = 'gs.eval("x")' + 'a'.repeat(10000);
      const result = validator.validate(script);

      expect(result.safe).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations!.length).toBeGreaterThanOrEqual(2);
      expect(result.violations!.some(v => v.includes('exceeds maximum length'))).toBe(true);
      expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = validator.getConfig();

      expect(config).toBeDefined();
      expect(config.maxScriptLength).toBe(10000);
      expect(config.blacklistedPatterns).toBeDefined();
      expect(config.requireConfirmation).toBeDefined();
    });

    it('should return a copy of config', () => {
      const config1 = validator.getConfig();
      const config2 = validator.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('updateConfig', () => {
    it('should update maxScriptLength', () => {
      validator.updateConfig({ maxScriptLength: 5000 });
      const config = validator.getConfig();

      expect(config.maxScriptLength).toBe(5000);
    });

    it('should update blacklistedPatterns', () => {
      const newPatterns = [/test/i];
      validator.updateConfig({ blacklistedPatterns: newPatterns });
      const config = validator.getConfig();

      expect(config.blacklistedPatterns).toEqual(newPatterns);
    });

    it('should update requireConfirmation', () => {
      const newOperations = ['customOperation'];
      validator.updateConfig({ requireConfirmation: newOperations });
      const config = validator.getConfig();

      expect(config.requireConfirmation).toEqual(newOperations);
    });

    it('should merge with existing config', () => {
      const originalConfig = validator.getConfig();
      validator.updateConfig({ maxScriptLength: 8000 });
      const newConfig = validator.getConfig();

      expect(newConfig.maxScriptLength).toBe(8000);
      expect(newConfig.blacklistedPatterns).toEqual(originalConfig.blacklistedPatterns);
      expect(newConfig.requireConfirmation).toEqual(originalConfig.requireConfirmation);
    });
  });
});
