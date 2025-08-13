'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { loadGoogleFonts, loadFont, getOrganizedFonts, searchFonts, preloadPopularFonts } from '@/lib/google-font';
import { GoogleFont } from '@/lib/types';
import { Palette, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw } from 'lucide-react';

interface PropertiesPanelProps {
	selectedObjectData?: {
		text: string;
		fontFamily: string;
		fontSize: number;
		fontWeight: string | number; // allow both
		fill: string;
		opacity: number;
		textAlign: string;
	};
	onUpdateText: (updates: any) => void;
}

const FONT_WEIGHTS = [
	{ value: 'normal', label: 'Normal' },
	{ value: 'bold', label: 'Bold' },
	{ value: '100', label: 'Thin' },
	{ value: '200', label: 'Extra Light' },
	{ value: '300', label: 'Light' },
	{ value: '400', label: 'Regular' },
	{ value: '500', label: 'Medium' },
	{ value: '600', label: 'Semi Bold' },
	{ value: '700', label: 'Bold' },
	{ value: '800', label: 'Extra Bold' },
	{ value: '900', label: 'Black' },
];

export const PropertiesPanel = ({ selectedObjectData, onUpdateText }: PropertiesPanelProps) => {
	const [fonts, setFonts] = useState<GoogleFont[]>([]);
	const [organizedFonts, setOrganizedFonts] = useState<{[key: string]: GoogleFont[]}>({});
	const [fontsLoading, setFontsLoading] = useState(true);
	const [fontSearchQuery, setFontSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [color, setColor] = useState('#000000');

	useEffect(() => {
		const loadFonts = async () => {
			try {
				console.log('🔄 Loading Google Fonts with API key...');
				const loadedFonts = await loadGoogleFonts();
				console.log(`✅ Loaded ${loadedFonts.length} fonts total`);
				
				setFonts(loadedFonts);
				setOrganizedFonts(getOrganizedFonts(loadedFonts));
				setFontsLoading(false);

				// Preload popular fonts in the background
				preloadPopularFonts(loadedFonts).catch(console.warn);
			} catch (error) {
				console.error('Failed to load fonts:', error);
				setFontsLoading(false);
			}
		};

		loadFonts();
	}, []);

	useEffect(() => {
		if (selectedObjectData?.fill) {
			setColor(selectedObjectData.fill);
		}
	}, [selectedObjectData?.fill]);

	if (!selectedObjectData) {
		return (
			<div className="w-80 bg-white border-l border-gray-200 p-4">
				<div className="text-center text-gray-500 py-8">
					Select a text layer to edit its properties
				</div>
			</div>
		);
	}

	const handleFontChange = async (fontFamily: string) => {
		await loadFont(fontFamily);
		onUpdateText({ fontFamily });
	};

	const handleColorChange = (newColor: string) => {
		setColor(newColor);
		onUpdateText({ fill: newColor });
	};

	// Get filtered fonts based on search and category
	const getFilteredFonts = () => {
		let filteredFonts = fonts;

		// Filter by category
		if (selectedCategory !== 'all') {
			filteredFonts = organizedFonts[selectedCategory] || [];
		}

		// Filter by search query
		if (fontSearchQuery.trim()) {
			filteredFonts = searchFonts(filteredFonts, fontSearchQuery);
		}

		return filteredFonts;
	};

	const filteredFonts = getFilteredFonts();

	return (
		<div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
			<h3 className="font-semibold text-lg mb-4">Text Properties</h3>

			<div className="space-y-6">
				{/* Text Content */}
				<div>
					<Label htmlFor="text-content">Content</Label>
					<Textarea
						id="text-content"
						value={selectedObjectData.text}
						onChange={(e) => onUpdateText({ text: e.target.value })}
						className="mt-1 resize-none"
						rows={3}
					/>
				</div>

				{/* Font Family */}
				<div>
					<Label>Font Family</Label>
					
					{/* Font Category Filter */}
					<div className="flex gap-2 mt-1 mb-2">
						<Select value={selectedCategory} onValueChange={setSelectedCategory}>
							<SelectTrigger className="flex-1">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								<SelectItem value="sans-serif">Sans Serif</SelectItem>
								<SelectItem value="serif">Serif</SelectItem>
								<SelectItem value="display">Display</SelectItem>
								<SelectItem value="handwriting">Handwriting</SelectItem>
								<SelectItem value="monospace">Monospace</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Font Search */}
					<Input
						placeholder="Search fonts..."
						value={fontSearchQuery}
						onChange={(e) => setFontSearchQuery(e.target.value)}
						className="mb-2"
					/>

					{/* Font Selection */}
					<Select value={selectedObjectData.fontFamily} onValueChange={handleFontChange}>
						<SelectTrigger>
							<SelectValue placeholder="Select font..." />
						</SelectTrigger>
						<SelectContent className="max-h-60">
							{fontsLoading ? (
								<SelectItem value="loading" disabled>
									🔄 Loading {process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY ? '1400+' : '26'} fonts...
								</SelectItem>
							) : filteredFonts.length === 0 ? (
								<SelectItem value="no-results" disabled>
									No fonts found for "{fontSearchQuery}"
								</SelectItem>
							) : (
								filteredFonts.map((font) => (
									<SelectItem key={font.family} value={font.family}>
										<div className="flex items-center justify-between w-full">
											<span style={{ fontFamily: font.family }}>{font.family}</span>
											<span className="text-xs text-gray-400 ml-2 capitalize">
												{font.category}
											</span>
										</div>
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
					
					{!fontsLoading && (
						<div className="text-xs text-gray-500 mt-1">
							{filteredFonts.length} of {fonts.length} fonts
							{process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY ? 
								' (Google Fonts API)' : 
								' (Offline mode)'
							}
						</div>
					)}
				</div>

				{/* Font Size */}
				<div>
					<Label>Font Size</Label>
					<div className="flex items-center gap-2 mt-1">
						<Slider
							value={[selectedObjectData.fontSize]}
							onValueChange={([value]) => onUpdateText({ fontSize: value })}
							max={200}
							min={8}
							step={1}
							className="flex-1"
						/>
						<Input
							type="number"
							value={selectedObjectData.fontSize}
							onChange={(e) => onUpdateText({ fontSize: parseInt(e.target.value) })}
							className="w-16"
							min={8}
							max={200}
						/>
					</div>
				</div>

				{/* Font Weight */}
				<div>
					<Label>Font Weight</Label>
					<Select value={String(selectedObjectData.fontWeight ?? '')} onValueChange={(value) => onUpdateText({ fontWeight: value })}>
						<SelectTrigger className="mt-1">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{FONT_WEIGHTS.map((weight) => (
								<SelectItem key={weight.value} value={weight.value}>
									{weight.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Text Color */}
				<div>
					<Label>Color</Label>
					<div className="mt-1">
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full justify-start gap-2">
									<div
										className="w-4 h-4 rounded border border-gray-300"
										style={{ backgroundColor: color }}
									/>
									<Palette className="w-4 h-4" />
									{color.toUpperCase()}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-3" align="start">
								<HexColorPicker color={color} onChange={handleColorChange} />
							</PopoverContent>
						</Popover>
					</div>
				</div>

				{/* Opacity */}
				<div>
					<Label>Opacity</Label>
					<div className="flex items-center gap-2 mt-1">
						<Slider
							value={[selectedObjectData.opacity * 100]}
							onValueChange={([value]) => onUpdateText({ opacity: value / 100 })}
							max={100}
							min={0}
							step={1}
							className="flex-1"
						/>
						<span className="text-sm text-gray-500 w-12">
							{Math.round(selectedObjectData.opacity * 100)}%
						</span>
					</div>
				</div>

				{/* Text Alignment */}
				<div>
					<Label>Alignment</Label>
					<div className="flex gap-1 mt-1">
						<Button
							variant={selectedObjectData.textAlign === 'left' ? 'default' : 'outline'}
							size="sm"
							onClick={() => onUpdateText({ textAlign: 'left' })}
						>
							<AlignLeft className="w-4 h-4" />
						</Button>
						<Button
							variant={selectedObjectData.textAlign === 'center' ? 'default' : 'outline'}
							size="sm"
							onClick={() => onUpdateText({ textAlign: 'center' })}
						>
							<AlignCenter className="w-4 h-4" />
						</Button>
						<Button
							variant={selectedObjectData.textAlign === 'right' ? 'default' : 'outline'}
							size="sm"
							onClick={() => onUpdateText({ textAlign: 'right' })}
						>
							<AlignRight className="w-4 h-4" />
						</Button>
					</div>
				</div>

				{/* Rotation */}
				<div>
					<Label>Rotation</Label>
					<div className="flex gap-1 mt-1">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onUpdateText({ rotation: 'left' })}
							title="Rotate left 15°"
						>
							<RotateCcw className="w-4 h-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => onUpdateText({ rotation: 'right' })}
							title="Rotate right 15°"
						>
							<RotateCw className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};