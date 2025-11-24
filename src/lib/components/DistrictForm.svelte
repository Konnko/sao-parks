<script lang="ts">
	import * as turf from '@turf/turf';

	type District = {
		id: number;
		name: string;
		geometry: { type: string; coordinates: number[][][] };
		area?: number;
	};

	let {
		geometry,
		district = null,
		onSubmit,
		onCancel
	}: {
		geometry: { type: string; coordinates: number[][][] };
		district?: District | null;
		onSubmit: (data: District) => void;
		onCancel: () => void;
	} = $props();

	let isEditMode = $derived(!!district);

	let name = $state(district?.name || '');
	let loading = $state(false);
	let error = $state('');
	let editableGeometry = $state(JSON.stringify(geometry, null, 2));
	let useManualArea = $state(isEditMode && district?.area !== undefined && district?.area !== null);
	let manualArea = $state(district?.area?.toString() || '');

	// Parse geometry from editable text and compute error
	let parsedGeometry = $derived.by(() => {
		try {
			const parsed = JSON.parse(editableGeometry);
			return { success: true, data: parsed, error: '' };
		} catch (e) {
			return { success: false, data: geometry, error: 'Неверный формат JSON' };
		}
	});

	let geometryError = $derived(parsedGeometry.error);
	let finalGeometry = $derived(parsedGeometry.data);

	// Auto-calculate area from geometry (in square meters)
	let calculatedArea = $derived.by(() => {
		if (!finalGeometry) return null;
		try {
			const polygon = turf.polygon(finalGeometry.coordinates);
			return turf.area(polygon); // Returns area in square meters
		} catch (e) {
			console.error('Failed to calculate area:', e);
			return null;
		}
	});

	// Final area to use: manual if enabled, otherwise calculated
	let area = $derived.by(() => {
		if (useManualArea) {
			const parsed = parseFloat(manualArea);
			return isNaN(parsed) ? null : parsed;
		}
		return calculatedArea;
	});

	async function handleSubmit() {
		error = '';

		if (!name) {
			error = 'Требуется название';
			return;
		}

		if (geometryError) {
			error = 'Исправьте ошибки в геометрии перед сохранением';
			return;
		}

		loading = true;

		try {
			const url = isEditMode ? `/api/districts/${district?.id}` : '/api/districts';
			const method = isEditMode ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					geometry: finalGeometry,
					area: area || null
				})
			});

			if (response.ok) {
				const updatedDistrict = await response.json();
				onSubmit(updatedDistrict);
			} else {
				const data = await response.json();
				error = data.error || `Не удалось ${isEditMode ? 'обновить' : 'создать'} район`;
			}
		} catch (err) {
			error = 'Произошла ошибка';
			console.error(err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="form-container">
	<h2>{isEditMode ? 'Редактировать район' : 'Создать новый район'}</h2>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<div class="form-group">
			<label for="name">Название *</label>
			<input
				type="text"
				id="name"
				bind:value={name}
				required
				placeholder="Введите название района"
			/>
		</div>

		<div class="form-group">
			<div class="area-header">
				<label for="areaToggle">Площадь</label>
				<label class="toggle-label">
					<input type="checkbox" id="areaToggle" bind:checked={useManualArea} />
					<span>Ввести вручную</span>
				</label>
			</div>

			{#if useManualArea}
				<input
					type="number"
					id="manualArea"
					bind:value={manualArea}
					placeholder="Введите площадь в м²"
					step="0.01"
					min="0"
				/>
				{#if area}
					<small>= {(area / 10000).toFixed(4)} гектаров</small>
				{/if}
			{:else if calculatedArea}
				<div class="info-field">
					<div class="info-value">
						{calculatedArea.toFixed(2)} м² ({(calculatedArea / 10000).toFixed(4)} гектаров)
					</div>
					<small>Автоматически вычислено из геометрии</small>
				</div>
			{:else}
				<div class="info-field">
					<div class="info-value text-muted">Не удалось вычислить площадь</div>
				</div>
			{/if}
		</div>

		<div class="form-group">
			<label for="geometry">Геометрия (JSON)</label>
			<textarea
				id="geometry"
				bind:value={editableGeometry}
				rows="8"
				placeholder="Координаты в формате GeoJSON"
				class:error-input={geometryError}
			></textarea>
			{#if geometryError}
				<small class="error-text">{geometryError}</small>
			{/if}
			<small>Формат: {`{"type": "Polygon", "coordinates": [[[lng, lat], ...]]}`}</small>
		</div>

		<div class="button-group">
			<button type="button" onclick={onCancel} disabled={loading}> Отмена </button>
			<button type="submit" disabled={loading}>
				{loading
					? isEditMode
						? 'Обновление...'
						: 'Создание...'
					: isEditMode
						? 'Обновить район'
						: 'Создать район'}
			</button>
		</div>
	</form>
</div>

<style>
	.form-container {
		width: 100%;
		max-width: 500px;
	}

	h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.error {
		background: #fee;
		color: #c33;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.info-field {
		padding: 0.75rem;
		background: #f9f9f9;
		border-radius: 4px;
		border: 1px solid #e0e0e0;
	}

	.info-value {
		font-weight: 600;
		color: #333;
		margin-bottom: 0.25rem;
	}

	.text-muted {
		color: #999;
		font-weight: 400;
	}

	.area-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.area-header label {
		margin-bottom: 0;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: normal;
		font-size: 0.875rem;
		color: #666;
		cursor: pointer;
	}

	.toggle-label input[type='checkbox'] {
		width: auto;
		margin: 0;
		cursor: pointer;
	}

	.toggle-label span {
		user-select: none;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #333;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		box-sizing: border-box;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #333;
	}

	textarea {
		font-family: 'Courier New', monospace;
		resize: vertical;
	}

	small {
		display: block;
		margin-top: 0.25rem;
		color: #666;
		font-size: 0.875rem;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	button {
		flex: 1;
		padding: 0.75rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}

	button[type='button'] {
		background: #f0f0f0;
		color: #333;
	}

	button[type='submit'] {
		background: #333;
		color: white;
	}

	button:hover:not(:disabled) {
		opacity: 0.9;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-input {
		border-color: #c33 !important;
		background: #fff8f8;
	}

	.error-text {
		color: #c33;
	}
</style>
