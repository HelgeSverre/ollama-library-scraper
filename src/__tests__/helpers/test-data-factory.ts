import type { ModelListItem, ModelDetails, ModelTag } from '../../ollama-scraper';

/**
 * Test data factory for creating consistent test objects
 * Provides builders for creating test data with sensible defaults and customizations
 */

export interface ModelListItemParams {
  name?: string;
  description?: string;
  parameters?: string[];
  pulls?: string;
  tags?: number;
  lastUpdated?: string;
  url?: string;
  capabilities?: string[];
}

export interface ModelDetailsParams {
  name?: string;
  description?: string;
  downloads?: string;
  lastUpdated?: string;
  readmeHtml?: string;
  readmeMarkdown?: string;
  models?: Array<{
    name?: string;
    size?: string;
    contextWindow?: string;
    inputType?: string;
    lastUpdated?: string;
  }>;
}

export interface ModelTagParams {
  name?: string;
  size?: string;
  digest?: string;
  modifiedAt?: string;
  contextWindow?: string;
  inputType?: string;
  aliases?: string[];
}

export class TestDataFactory {
  /**
   * Create a model list item with default values and customizations
   */
  static createModelListItem(params: ModelListItemParams = {}): ModelListItem {
    return {
      name: params.name ?? 'test-model',
      description: params.description ?? 'A test model for unit testing',
      parameters: params.parameters ?? ['7b', '13b'],
      pulls: params.pulls ?? '1K',
      tags: params.tags ?? 5,
      lastUpdated: params.lastUpdated ?? '2 hours ago',
      url: params.url ?? 'https://ollama.com/library/test-model',
      capabilities: params.capabilities,
    };
  }

  /**
   * Create multiple model list items for testing large datasets
   */
  static createModelListItems(
    count: number,
    customizer?: (index: number) => ModelListItemParams
  ): ModelListItem[] {
    return Array.from({ length: count }, (_, index) => {
      const baseParams = customizer ? customizer(index) : {};
      return this.createModelListItem({
        name: `test-model-${index + 1}`,
        ...baseParams,
      });
    });
  }

  /**
   * Create a model details object with default values and customizations
   */
  static createModelDetails(params: ModelDetailsParams = {}): ModelDetails {
    return {
      name: params.name ?? 'test-model',
      description: params.description ?? 'A test model for unit testing',
      downloads: params.downloads ?? '1K',
      lastUpdated: params.lastUpdated ?? '2 hours ago',
      readmeHtml: params.readmeHtml,
      readmeMarkdown: params.readmeMarkdown,
      models: params.models?.map(model => ({
        name: model.name ?? 'latest',
        size: model.size ?? '4.1GB',
        contextWindow: model.contextWindow,
        inputType: model.inputType,
        lastUpdated: model.lastUpdated ?? '2 hours ago',
      })) ?? [
        {
          name: 'latest',
          size: '4.1GB',
          contextWindow: '32K',
          inputType: 'Text',
          lastUpdated: '2 hours ago',
        },
        {
          name: '7b',
          size: '4.1GB',
          contextWindow: '32K',
          inputType: 'Text',
          lastUpdated: '2 hours ago',
        },
      ],
    };
  }

  /**
   * Create a model tag with default values and customizations
   */
  static createModelTag(params: ModelTagParams = {}): ModelTag {
    return {
      name: params.name ?? 'latest',
      size: params.size ?? '4.1GB',
      digest: params.digest ?? 'abc123def456',
      modifiedAt: params.modifiedAt ?? '2 hours ago',
      contextWindow: params.contextWindow,
      inputType: params.inputType,
      aliases: params.aliases,
    };
  }

  /**
   * Create multiple model tags for testing
   */
  static createModelTags(
    count: number,
    customizer?: (index: number) => ModelTagParams
  ): ModelTag[] {
    return Array.from({ length: count }, (_, index) => {
      const baseParams = customizer ? customizer(index) : {};
      return this.createModelTag({
        name: index === 0 ? 'latest' : `tag-${index}`,
        digest: `${index.toString().padStart(3, '0')}123def456`,
        ...baseParams,
      });
    });
  }

  /**
   * Create HTML for a model listing page
   */
  static createModelListingHtml(models: ModelListItemParams[]): string {
    const modelItems = models
      .map(model => {
        const capabilities = model.capabilities ? model.capabilities.join(', ') : '';
        const parametersText = model.parameters ? model.parameters.join(', ') : '';

        return `
        <li>
          <a href="/library/${model.name || 'test-model'}">${model.name || 'test-model'}</a>
          ${model.description || 'Test description'}
          ${capabilities ? `Capabilities: ${capabilities}` : ''}
          ${parametersText ? `Parameters: ${parametersText}` : ''}
          ${model.pulls || '1K'} Pulls
          ${model.tags || 1} Tags
          Updated ${model.lastUpdated || '2 hours ago'}
        </li>
      `;
      })
      .join('\n');

    return `
      <html>
        <body>
          <ul>
            ${modelItems}
          </ul>
        </body>
      </html>
    `;
  }

  /**
   * Create HTML for a model details page
   */
  static createModelDetailsHtml(details: ModelDetailsParams): string {
    const readmeSection = details.readmeHtml
      ? `
      <div id="display">
        ${details.readmeHtml}
      </div>
    `
      : '';

    const modelVariants =
      details.models
        ?.map(
          model => `
      <a href="/library/${details.name}:${model.name}">${model.name}</a>
      <div>
        ${model.size || '4.1GB'}
        ${model.contextWindow ? `${model.contextWindow} context` : ''}
        ${model.inputType || 'Text'}
        ${model.lastUpdated || '2 hours ago'}
      </div>
    `
        )
        .join('\n') || '';

    return `
      <html>
        <body>
          <main>
            ${details.name || 'test-model'}
            ${details.description || 'Test description'}
            ${details.downloads || '1K'} Downloads
            Updated ${details.lastUpdated || '2 hours ago'}
            ${modelVariants}
            ${readmeSection}
          </main>
        </body>
      </html>
    `;
  }

  /**
   * Create HTML for a model tags page
   */
  static createModelTagsHtml(modelName: string, tags: ModelTagParams[]): string {
    const tagItems = tags
      .map(
        tag => `
      <a href="/library/${modelName}:${tag.name}">${tag.name}</a>
      <div>
        ${tag.size || '4.1GB'}
        ${tag.digest || 'abc123def456'}
        ${tag.contextWindow ? `${tag.contextWindow} context` : ''}
        ${tag.inputType || 'Text'}
        ${tag.modifiedAt || '2 hours ago'}
        ${tag.aliases ? tag.aliases.join(', ') : ''}
      </div>
    `
      )
      .join('\n');

    return `
      <html>
        <body>
          <main>
            <h1>${modelName} Tags</h1>
            ${tagItems}
          </main>
        </body>
      </html>
    `;
  }

  /**
   * Create preset test scenarios for common testing patterns
   */
  static presets = {
    // Models with different capabilities
    visionModel: (): ModelListItemParams => ({
      name: 'vision-model',
      description: 'A model with vision capabilities',
      capabilities: ['vision'],
      parameters: ['7b', '13b'],
    }),

    embeddingModel: (): ModelListItemParams => ({
      name: 'embedding-model',
      description: 'A model for text embedding',
      capabilities: ['embedding'],
      parameters: ['small', 'large'],
    }),

    toolsModel: (): ModelListItemParams => ({
      name: 'tools-model',
      description: 'A model that can use tools',
      capabilities: ['tools'],
      parameters: ['7b'],
    }),

    thinkingModel: (): ModelListItemParams => ({
      name: 'thinking-model',
      description: 'A model with thinking capabilities',
      capabilities: ['thinking'],
      parameters: ['7b', '70b'],
    }),

    multiCapabilityModel: (): ModelListItemParams => ({
      name: 'multi-model',
      description: 'A model with multiple capabilities',
      capabilities: ['vision', 'tools', 'thinking'],
      parameters: ['7b', '13b', '70b'],
    }),

    // Models with different popularity levels
    popularModel: (): ModelListItemParams => ({
      name: 'popular-model',
      pulls: '100M',
      tags: 50,
    }),

    newModel: (): ModelListItemParams => ({
      name: 'new-model',
      pulls: '100',
      tags: 1,
      lastUpdated: '1 hour ago',
    }),

    // Edge case models
    emptyModel: (): ModelListItemParams => ({
      name: 'empty-model',
      description: '',
      parameters: [],
      pulls: '0',
      tags: 0,
    }),

    largeModel: (): ModelListItemParams => ({
      name: 'large-model',
      parameters: ['405b', '1t'],
      pulls: '999.9M',
      tags: 999,
    }),

    // Model details presets
    detailsWithReadme: (): ModelDetailsParams => ({
      name: 'readme-model',
      readmeHtml:
        '<h1>Test README</h1><p>This is a test readme with <strong>formatting</strong>.</p>',
      readmeMarkdown: '# Test README\n\nThis is a test readme with **formatting**.',
    }),

    detailsWithoutReadme: (): ModelDetailsParams => ({
      name: 'no-readme-model',
      readmeHtml: undefined,
      readmeMarkdown: undefined,
    }),

    detailsWithManyVariants: (): ModelDetailsParams => ({
      name: 'many-variants-model',
      models: [
        { name: 'latest', size: '4.1GB', lastUpdated: '2 hours ago' },
        { name: '7b', size: '4.1GB', lastUpdated: '2 hours ago' },
        { name: '13b', size: '7.3GB', lastUpdated: '2 hours ago' },
        { name: '70b', size: '39GB', lastUpdated: '2 hours ago' },
        { name: '7b-q4', size: '3.8GB', lastUpdated: '2 hours ago' },
        { name: '7b-q8', size: '7.2GB', lastUpdated: '2 hours ago' },
      ],
    }),
  };

  /**
   * Generate a complete test scenario with listing, details, and tags
   */
  static createCompleteTestScenario(modelName: string) {
    const listingModel = this.createModelListItem({ name: modelName });
    const details = this.createModelDetails({ name: modelName });
    const tags = this.createModelTags(3, index => ({
      name: index === 0 ? 'latest' : `v${index}`,
    }));

    return {
      model: listingModel,
      details,
      tags,
      html: {
        listing: this.createModelListingHtml([listingModel]),
        details: this.createModelDetailsHtml(details),
        tags: this.createModelTagsHtml(modelName, tags),
      },
    };
  }
}

export default TestDataFactory;
