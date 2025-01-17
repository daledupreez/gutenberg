/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHeading as Heading,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import DataViewItem from './dataview-item';
import AddNewItem from './add-new-view';
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];

function CustomDataViewItem( { dataviewId, isActive } ) {
	const {
		params: { path },
	} = useLocation();
	const history = useHistory();
	const { dataview } = useSelect(
		( select ) => {
			const { getEditedEntityRecord } = select( coreStore );
			return {
				dataview: getEditedEntityRecord(
					'postType',
					'wp_dataviews',
					dataviewId
				),
			};
		},
		[ dataviewId ]
	);
	const { deleteEntityRecord } = useDispatch( coreStore );
	const type = useMemo( () => {
		const viewContent = JSON.parse( dataview.content );
		return viewContent.type;
	}, [ dataview.content ] );
	return (
		<DataViewItem
			title={ dataview.title }
			type={ type }
			isActive={ isActive }
			isCustom="true"
			customViewId={ dataviewId }
			suffix={
				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'Actions' ) }
					toggleProps={ {
						style: {
							color: 'inherit',
						},
					} }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							<MenuItem
								onClick={ async () => {
									await deleteEntityRecord(
										'postType',
										'wp_dataviews',
										dataview.id,
										{
											force: true,
										}
									);
									if ( isActive ) {
										history.replace( {
											path,
										} );
									}
									onClose();
								} }
								isDestructive
							>
								{ __( 'Delete' ) }
							</MenuItem>
						</MenuGroup>
					) }
				</DropdownMenu>
			}
		/>
	);
}

export function useCustomDataViews( type ) {
	const customDataViews = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
		const dataViewTypeRecords = getEntityRecords(
			'taxonomy',
			'wp_dataviews_type',
			{ slug: type }
		);
		if ( ! dataViewTypeRecords || dataViewTypeRecords.length === 0 ) {
			return EMPTY_ARRAY;
		}
		const dataViews = getEntityRecords( 'postType', 'wp_dataviews', {
			wp_dataviews_type: dataViewTypeRecords[ 0 ].id,
			orderby: 'date',
			order: 'asc',
		} );
		if ( ! dataViews ) {
			return EMPTY_ARRAY;
		}
		return dataViews;
	} );
	return customDataViews;
}

export default function CustomDataViewsList( { type, activeView, isCustom } ) {
	const customDataViews = useCustomDataViews( type );
	return (
		<>
			<div className="edit-site-sidebar-navigation-screen-dataviews__group-header">
				<Heading level={ 2 }>{ __( 'Custom Views' ) }</Heading>
			</div>
			<ItemGroup>
				{ customDataViews.map( ( customViewRecord ) => {
					return (
						<CustomDataViewItem
							key={ customViewRecord.id }
							dataviewId={ customViewRecord.id }
							isActive={
								isCustom === 'true' &&
								Number( activeView ) === customViewRecord.id
							}
						/>
					);
				} ) }
				<AddNewItem type={ type } />
			</ItemGroup>
		</>
	);
}
