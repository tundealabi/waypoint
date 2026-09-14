import { Button as NativeButton, FieldGroup, Host, TextInput } from '@expo/ui';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Pressable, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatDateRange, parseIsoDate, toIsoDate } from '@/lib/dates';
import { pickCoverUri } from '@/lib/pick-cover';
import type { TripDraft } from '@/store';
import { colors, spacing } from '@/theme';

export function TripFields({
  draft,
  onChange,
  submitTitle,
  onSubmit,
  submitDisabled,
  fill = true,
}: {
  draft: TripDraft;
  onChange: (_patch: Partial<TripDraft>) => void;
  submitTitle: string;
  onSubmit: () => void;
  submitDisabled?: boolean;
  fill?: boolean;
}) {
  useColorScheme();
  const [pickingStart, setPickingStart] = useState(process.env.EXPO_OS === 'ios');
  const [pickingEnd, setPickingEnd] = useState(process.env.EXPO_OS === 'ios');

  return (
    <View style={fill ? { flex: 1 } : undefined}>
      <Host style={fill ? { flex: 1 } : { minHeight: 240 }} useViewportSizeMeasurement>
        <FieldGroup>
          <FieldGroup.Section title="Details">
            <TextInput
              defaultValue={draft.name}
              placeholder="Trip name"
              autoCapitalize="sentences"
              onChangeText={(name) => onChange({ name })}
            />
            <TextInput
              defaultValue={draft.destination}
              placeholder="Destination"
              autoCapitalize="words"
              onChangeText={(destination) => onChange({ destination })}
            />
            <TextInput
              defaultValue={draft.emoji ?? ''}
              placeholder="Emoji (optional)"
              maxLength={4}
              onChangeText={(emoji) => onChange({ emoji })}
            />
          </FieldGroup.Section>
          <NativeButton
            label={submitTitle}
            variant="filled"
            onPress={submitDisabled ? undefined : onSubmit}
          />
        </FieldGroup>
      </Host>
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <ThemedText variant="caption">Dates</ThemedText>
        <DateRow
          label="Start"
          value={draft.startDate}
          open={pickingStart}
          onOpen={() => setPickingStart(true)}
          onChange={(startDate) => {
            onChange({ startDate });
            if (process.env.EXPO_OS !== 'ios') {
              setPickingStart(false);
            }
          }}
          onDismiss={() => setPickingStart(false)}
        />
        <DateRow
          label="End"
          value={draft.endDate}
          open={pickingEnd}
          minimumDate={parseIsoDate(draft.startDate)}
          onOpen={() => setPickingEnd(true)}
          onChange={(endDate) => {
            onChange({ endDate });
            if (process.env.EXPO_OS !== 'ios') {
              setPickingEnd(false);
            }
          }}
          onDismiss={() => setPickingEnd(false)}
        />
        <ThemedText variant="caption">{formatDateRange(draft.startDate, draft.endDate)}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose cover photo"
          onPress={async () => {
            const coverUri = await pickCoverUri();
            if (coverUri) {
              onChange({ coverUri });
            }
          }}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <ThemedText variant="headline" style={{ color: colors.systemBlue }}>
            {draft.coverUri ? 'Change cover photo' : 'Add cover photo'}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function DateRow({
  label,
  value,
  open,
  minimumDate,
  onOpen,
  onChange,
  onDismiss,
}: {
  label: string;
  value: string;
  open: boolean;
  minimumDate?: Date;
  onOpen: () => void;
  onChange: (_value: string) => void;
  onDismiss: () => void;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={{
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <ThemedText variant="body">{label}</ThemedText>
        <ThemedText variant="body" style={{ color: colors.systemBlue }}>
          {parseIsoDate(value).toLocaleDateString()}
        </ThemedText>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={parseIsoDate(value)}
          mode="date"
          display={process.env.EXPO_OS === 'ios' ? 'compact' : 'default'}
          presentation={process.env.EXPO_OS === 'android' ? 'dialog' : 'inline'}
          minimumDate={minimumDate}
          onValueChange={(_event, date) => onChange(toIsoDate(date))}
          onDismiss={onDismiss}
        />
      ) : null}
    </View>
  );
}
