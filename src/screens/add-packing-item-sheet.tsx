import {
  BottomSheet,
  Button as NativeButton,
  Column,
  Host,
  Picker,
  Text,
  TextInput,
} from '@expo/ui';
import { useState } from 'react';

import type { Member, PackingDraft } from '@/store';

const emptyDraft: PackingDraft = { name: '', quantity: '', note: '', assigneeId: '' };

export function AddPackingItemSheet({
  presented,
  members,
  initial,
  onDismiss,
  onSave,
}: {
  presented: boolean;
  members: Member[];
  initial?: PackingDraft;
  onDismiss: () => void;
  onSave: (_draft: PackingDraft) => void;
}) {
  const [draft, setDraft] = useState<PackingDraft>(initial ?? emptyDraft);
  const canSave = Boolean(draft.name.trim());

  return (
    <Host>
      <BottomSheet isPresented={presented} onDismiss={onDismiss} snapPoints={['half', 'full']}>
        <Column>
          <Text>{initial ? 'Edit item' : 'Add item'}</Text>
          <TextInput
            defaultValue={draft.name}
            placeholder="Item name"
            onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
          />
          <TextInput
            defaultValue={draft.quantity ?? ''}
            placeholder="Quantity (optional)"
            onChangeText={(quantity) => setDraft((current) => ({ ...current, quantity }))}
          />
          <TextInput
            defaultValue={draft.note ?? ''}
            placeholder="Note (optional)"
            onChangeText={(note) => setDraft((current) => ({ ...current, note }))}
          />
          <Picker
            selectedValue={draft.assigneeId ?? ''}
            onValueChange={(assigneeId) => setDraft((current) => ({ ...current, assigneeId }))}
          >
            <Picker.Item label="Anyone" value="" />
            {members.map((member) => (
              <Picker.Item key={member.id} label={member.name} value={member.userId} />
            ))}
          </Picker>
          <NativeButton
            label={initial ? 'Save item' : 'Add item'}
            onPress={() => {
              if (!canSave) {
                return;
              }
              onSave(draft);
            }}
          />
          <NativeButton label="Cancel" variant="text" onPress={onDismiss} />
        </Column>
      </BottomSheet>
    </Host>
  );
}
