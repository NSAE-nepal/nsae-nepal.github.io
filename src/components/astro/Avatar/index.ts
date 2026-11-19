import Avatar from "@/components/astro/Avatar/Avatar.astro";
import AvatarFallback from "@/components/astro/Avatar/AvatarFallback.astro";
import AvatarImage from "@/components/astro/Avatar/AvatarImage.astro";

export { Avatar, AvatarFallback, AvatarImage };

export default {
	Root: Avatar,
	Image: AvatarImage,
	Fallback: AvatarFallback,
};
