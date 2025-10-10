// components/FormattedText.js
import React from 'react';
import { useWindowDimensions, Linking, Alert } from 'react-native';
import RenderHTML from 'react-native-render-html';

export default function FormattedText({ html }) {
  const { width } = useWindowDimensions();

  const tagsStyles = {
    body: { color: '#E5E5EA', fontSize: 15, lineHeight: 22 },
    a: { color: '#0A84FF', textDecorationLine: 'underline' },
    b: { fontWeight: '700', color: '#FFFFFF' },
    strong: { fontWeight: '700', color: '#FFFFFF' },
    i: { fontStyle: 'italic' },
    u: { textDecorationLine: 'underline' },
    span: { color: '#E5E5EA' },
    li: { marginBottom: 6, color: '#E5E5EA' },
    table: {
      borderWidth: 1,
      borderColor: '#555',
      borderRadius: 4,
      width: '100%',
      backgroundColor: '#2C2C2E',
    },
    tr: { borderBottomWidth: 1, borderColor: '#555' },
    td: { borderWidth: 1, borderColor: '#555', padding: 6, color: '#E5E5EA' },
    th: {
      borderWidth: 1,
      borderColor: '#555',
      backgroundColor: '#3A3A3C',
      color: '#FFFFFF',
      fontWeight: '700',
      padding: 6,
    },
  };

  const renderersProps = {
    a: {
      onPress: (_, href) => {
        if (!href) return;
        Linking.openURL(href).catch(() => {
          Alert.alert('Error', 'Unable to open link.');
        });
      },
    },
  };

  return (
    <RenderHTML
      source={{ html: html || '<p style="color:#8E8E93">(No content)</p>' }}
      contentWidth={width - 40}
      tagsStyles={tagsStyles}
      renderersProps={renderersProps}
      enableExperimentalMarginCollapsing={true}
      baseStyle={{ color: '#E5E5EA' }}
    />
  );
}
