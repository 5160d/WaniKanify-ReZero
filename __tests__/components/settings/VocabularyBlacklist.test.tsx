/** @jest-environment jsdom */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { VocabularyBlacklistTextArea } from '~src/components/settings/VocabularyBlacklist';

// Helper to build a large blacklist string of unique tokens
const buildList = (count: number) => Array.from({ length: count }, (_, i) => `word${i}`).join(';');

describe('VocabularyBlacklistTextArea', () => {
  it('deduplicates repeated entries in count', () => {
    const onChange = jest.fn();
    const onErrorHandled = jest.fn();
    const { getByRole, getByText } = render(
      <VocabularyBlacklistTextArea
        value={''}
        onChange={onChange}
        onErrorHandled={onErrorHandled}
      />
    );
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'apple;apple;banana' } });
    // Counter should show 2 unique words
    getByText(/2 \/ 1000 words/);
  });

  it('shows error when exceeding soft cap', () => {
    const onChange = jest.fn();
    const onErrorHandled = jest.fn();
    const overLimit = buildList(1001);
    const { getByRole, getByText } = render(
      <VocabularyBlacklistTextArea
        value={''}
        onChange={onChange}
        onErrorHandled={onErrorHandled}
      />
    );
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: overLimit } });
    getByText(/Too many entries: 1001 \/ 1000/);
  });
});
