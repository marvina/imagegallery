// Strapi API Client

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

/**
 * Fetch all projects from Strapi
 * @returns {Promise<Array>} Normalized project data
 */
export async function fetchProjects() {
    console.log('Fetching projects from:', STRAPI_URL);
    if (!STRAPI_URL) {
        console.warn('Strapi URL not set, using mock data.');
        return null;
    }

    try {
        // Public API - No token needed if permissions are set
        const headers = {
            'Content-Type': 'application/json',
        };

        const response = await fetch(`${STRAPI_URL}/api/projects?populate=*&pagination[limit]=100`, {
            headers
        });

        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response JSON:', data);

        // Strapi v5 often returns { data: [...], meta: ... }
        // If data.data exists, use it. Otherwise assume data is the array or object.
        const items = data.data || data;

        return normalizeStrapiData(items);

    } catch (error) {
        console.error('Failed to fetch from Strapi:', error);
        return null; // Return null to trigger fallback/mock
    }
}

/**
 * Fetch all tags from Strapi
 * @returns {Promise<Array>} List of tag names
 */
export async function fetchTags() {
    if (!STRAPI_URL) return [];

    try {
        const response = await fetch(`${STRAPI_URL}/api/tags?pagination[limit]=100`, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Failed to fetch tags');

        const data = await response.json();
        const items = data.data || data;

        if (!Array.isArray(items)) return [];

        return items.map(item => {
            const attr = item.attributes || item;
            return attr.name;
        }).filter(name => name); // Filter out empty names

    } catch (error) {
        console.error('Failed to fetch tags:', error);
        return [];
    }
}

/**
 * Normalize Strapi v4 response structure to our flat app structure
 */
function normalizeStrapiData(strapiData) {
    if (!Array.isArray(strapiData)) {
        console.warn('strapiData is not an array:', strapiData);
        return [];
    }

    return strapiData.map(item => {
        // Hybrid handling: v4 uses 'attributes', v5 might be flat or parameterized
        const attr = item.attributes || item;
        const id = item.id;

        // Helper to get image URL
        const getImageUrl = (imgData) => {
            if (!imgData) return null;
            // v4 nested data.attributes.url or v5 flat .url
            const data = imgData.data || imgData;
            if (!data) return null;

            const url = data.attributes?.url || data.url;
            if (!url) return null;

            // Check if it's already absolute
            return url.startsWith('http') ? url : `${STRAPI_URL}${url}`;
        };

        // Helper to get relations
        const getAuthor = (authData) => {
            if (!authData) return { name: 'Unknown', avatar: null };
            const data = authData.data || authData;
            if (!data) return { name: 'Unknown', avatar: null };

            const authAttr = data.attributes || data;
            return {
                name: authAttr.name,
                avatar: getImageUrl(authAttr.avatar),
                bio: authAttr.bio
            };
        };

        const getGallery = (galleryData) => {
            if (!galleryData) return [];
            const data = galleryData.data || galleryData;
            if (!Array.isArray(data)) return [];
            return data.map(img => getImageUrl(img));
        };

        const getTags = (tagsData) => {
            if (!tagsData) return 'Uncategorized';
            const data = tagsData.data || tagsData;
            if (!Array.isArray(data) || data.length === 0) return 'Uncategorized';
            // Just take the first tag
            const firstTag = data[0];
            const tagAttr = firstTag.attributes || firstTag;
            return tagAttr.name || 'Uncategorized';
        };


        // Fallback for Title: user might have used 'name'
        const title = attr.title || attr.name || 'Untitled Project';



        const author = getAuthor(attr.author);

        // Deterministic aspect ratio fallback based on ID
        let ratio = attr.aspectRatio;
        if (!ratio) {
            // Simple hash function for stability
            const seed = (typeof id === 'number' ? id : 0) * 9301 + 49297;
            const rnd = (seed % 233280) / 233280.0;
            ratio = 0.8 + rnd * 0.8;
        }

        return {
            id: id,
            title: title,
            img: getImageUrl(attr.cover),
            gallery: getGallery(attr.gallery),
            description: attr.description,
            author: author.name,
            avatar: author.avatar,
            tag: getTags(attr.tags),
            aspectRatio: ratio,
        };
    });
}
