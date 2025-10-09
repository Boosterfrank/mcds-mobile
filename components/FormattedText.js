import React from 'react';
import { useWindowDimensions, Linking } from 'react-native';
import RenderHTML from 'react-native-render-html';

export default function FormattedText({ html }) {
  const { width } = useWindowDimensions();
  if (!html) return null;

  // Decode \u003C and \u003E and clean up escaped strings
  const decodedHtml = html
    ?.replace(/\\u003C/g, '<')
    .replace(/\\u003E/g, '>')
    .replace(/\\n/g, '')
    .replace(/\\t/g, '')
    .trim();

  return (
    <RenderHTML
      contentWidth={width}
      source={{ html: decodedHtml }}
      baseStyle={{
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 22,
      }}
      tagsStyles={{
        b: { fontWeight: 'bold' },
        strong: { fontWeight: 'bold' },
        i: { fontStyle: 'italic' },
        em: { fontStyle: 'italic' },
        u: { textDecorationLine: 'underline' },
        s: { textDecorationLine: 'line-through' },
        strike: { textDecorationLine: 'line-through' },
        a: { color: '#4da6ff', textDecorationLine: 'underline' },
        ol: { marginVertical: 6, paddingLeft: 20 },
        ul: { marginVertical: 6, paddingLeft: 20 },
        li: { color: '#E5E5EA', fontSize: 15, lineHeight: 22 },
        table: {
          borderWidth: 1,
          borderColor: '#666',
          marginVertical: 10,
          width: '100%',
          borderRadius: 4,
        },
        th: {
          borderWidth: 1,
          borderColor: '#666',
          padding: 6,
          backgroundColor: '#2C2C2E',
          color: '#FFFFFF',
          fontWeight: 'bold',
          textAlign: 'center',
        },
        td: {
          borderWidth: 1,
          borderColor: '#666',
          padding: 6,
          color: '#E5E5EA',
        },
        span: { color: '#FFFFFF' },
      }}
      renderersProps={{
        a: {
          onPress: (_, href) => {
            Linking.openURL(href).catch((err) =>
              console.warn('Failed to open link:', err)
            );
          },
        },
      }}
    />
  );
}