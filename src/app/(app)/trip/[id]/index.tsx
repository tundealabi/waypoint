import { FlashList } from '@shopify/flash-list';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Banner } from '@/components/banner';
import { EmptyState } from '@/components/empty-state';
import { HeaderActions, HeaderIconButton } from '@/components/header-actions';
import { PackingRow } from '@/components/packing-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { firstParam } from '@/lib/params';
import { AddPackingItemSheet } from '@/screens/add-packing-item-sheet';
import type { PackingDraft, PackingItem } from '@/store';
import {
  addPackingItem,
  applyPackingTemplate,
  clearResurrection,
  deletePackingItem,
  getMembers,
  getPackingItems,
  getTrip,
  movePackingItem,
  packingProgress,
  setPacked,
  updatePackingItem,
  useWaypoint,
} from '@/store';
import { spacing } from '@/theme';

export default function PackingScreen() {
  const snapshot = useWaypoint();
  const tripId = firstParam(useLocalSearchParams<{ id: string }>().id);
  const trip = getTrip(tripId);
  const items = getPackingItems(tripId);
  const members = getMembers(tripId);
  const progress = packingProgress(tripId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PackingItem | null>(null);

  const openAddMenu = () => {
    Alert.alert('Add', undefined, [
      { text: 'Item', onPress: () => setSheetOpen(true) },
      { text: 'Beach template', onPress: () => applyPackingTemplate(tripId, 'beach') },
      { text: 'City template', onPress: () => applyPackingTemplate(tripId, 'city') },
      { text: 'Camping template', onPress: () => applyPackingTemplate(tripId, 'camping') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (!trip) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Trip' }} />
        <EmptyState
          title="Trip not found"
          body="This trip is gone or you are no longer a member."
          actionTitle="Back to trips"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  const saveItem = (draft: PackingDraft) => {
    if (editing) {
      updatePackingItem(editing.id, draft);
    } else {
      addPackingItem(tripId, draft);
    }
    setEditing(null);
    setSheetOpen(false);
  };

  return (
    <Screen grouped>
      <Stack.Screen
        options={{
          title: trip.name,
          headerRight: () => (
            <HeaderActions
              extra={
                <>
                  <HeaderIconButton label="Add" onPress={openAddMenu} />
                  <HeaderIconButton
                    label="Settings"
                    onPress={() => router.push(`/trip/${tripId}/settings`)}
                  />
                </>
              }
            />
          ),
        }}
      />
      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          snapshot.resurrectionMessage || progress.total > 0 ? (
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
              {snapshot.resurrectionMessage ? (
                <Banner message={snapshot.resurrectionMessage} onDismiss={clearResurrection} />
              ) : null}
              {progress.total > 0 ? (
                <>
                  <ThemedText
                    variant="headline"
                    selectable
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {progress.packed} of {progress.total} packed
                  </ThemedText>
                  {progress.perMember.length > 0 ? (
                    <ThemedText
                      variant="caption"
                      selectable
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {progress.perMember
                        .map((row) => `${row.name} ${row.packed} of ${row.total}`)
                        .join(' · ')}
                    </ThemedText>
                  ) : null}
                </>
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="Nothing packed yet"
            body="Add an item or start from a beach, city, or camping list."
            actionTitle="Add an item"
            onAction={() => setSheetOpen(true)}
          />
        }
        renderItem={({ item, index }) => (
          <PackingRow
            item={item}
            assigneeName={members.find((member) => member.userId === item.assigneeId)?.name}
            canMoveUp={index > 0}
            canMoveDown={index < items.length - 1}
            onTogglePacked={() => setPacked(item.id, !item.packed)}
            onDelete={() => deletePackingItem(item.id)}
            onEdit={() => {
              setEditing(item);
              setSheetOpen(true);
            }}
            onMove={(direction) => movePackingItem(item.id, direction)}
          />
        )}
      />
      <AddPackingItemSheet
        key={`${sheetOpen ? 'open' : 'closed'}-${editing?.id ?? 'add'}`}
        presented={sheetOpen}
        members={members}
        initial={
          editing
            ? {
                name: editing.name,
                quantity: editing.quantity,
                note: editing.note,
                assigneeId: editing.assigneeId ?? '',
              }
            : undefined
        }
        onDismiss={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSave={saveItem}
      />
    </Screen>
  );
}
